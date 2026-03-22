import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import User from './models/User.js';
import Post from './models/Post.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const uploadMiddleware = multer({ dest: 'uploads/' });
const salt = bcrypt.genSaltSync(10);
const secret = process.env.JWT_SECRET;

// Ensure uploads directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

app.use(cors({ credentials: true, origin: ['http://localhost:5173', 'http://localhost:5174', 'https://blog-six-rosy-89.vercel.app'] }));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Register a new user
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const userDoc = await User.create({
      username,
      password: bcrypt.hashSync(password, salt),
    });
    res.json({
      id: userDoc._id,
      username: userDoc.username,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: 'Registration failed', details: error.message });
  }
});

// Login a user
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const userDoc = await User.findOne({ username });
    if (!userDoc) return res.status(400).json('User not found');
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (passOk) {
      jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
        if (err) return res.status(500).json('Token generation failed');
        res.cookie('token', token,{
          httpOnly: true,
          secure: true,
          sameSite: 'None',
        }).json({
          id: userDoc._id,
          username,
        });
      });
    } else {
      res.status(400).json('Wrong credentials');
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json('Server error');
  }
});

// Get user profile
app.get('/profile', (req, res) => {
  const { token } = req.cookies;
  if (!token) return res.status(401).json('No token provided');
  jwt.verify(token, secret, {}, (err, info) => {
    if (err) return res.status(401).json('Invalid token');
    res.json(info);
  });
});

// Logout user
app.post('/logout', (req, res) => {
  res.cookie('token', '').json('ok');
});

// Create a new post
app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
  const { token } = req.cookies;
  if (!token) return res.status(401).json('Unauthorized');

  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) return res.status(401).json('Invalid token');

    let newPath = null;
    if (req.file) {
      const { originalname, path } = req.file;
      const parts = originalname.split('.');
      const ext = parts[parts.length - 1];
      newPath = path + '.' + ext;
      fs.renameSync(path, newPath);
    }

    const { title, summary, content } = req.body;
    try {
      const postDoc = await Post.create({
        title,
        summary,
        content,
        cover: newPath ? newPath.replace(/\\/g, '/') : null,
        author: info.id,
      });
      res.json(postDoc);
    } catch (error) {
      console.error('Post creation error:', error);
      res.status(400).json({ error: 'Post creation failed', details: error.message });
    }
  });
});

// Update an existing post
app.put('/post', uploadMiddleware.single('file'), async (req, res) => {
  const { token } = req.cookies;
  if (!token) return res.status(401).json('Unauthorized');

  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) return res.status(401).json('Invalid token');

    let newPath = null;
    if (req.file) {
      const { originalname, path } = req.file;
      const parts = originalname.split('.');
      const ext = parts[parts.length - 1];
      newPath = path + '.' + ext;
      fs.renameSync(path, newPath);
    }

    const { id, title, summary, content } = req.body;
    try {
      const postDoc = await Post.findById(id);
      if (!postDoc) return res.status(404).json('Post not found');
      if (postDoc.author.toString() !== info.id) {
        return res.status(403).json('You are not the author');
      }
      await postDoc.updateOne({
        title,
        summary,
        content,
        cover: newPath || postDoc.cover,
      });
      const updatedPost = await Post.findById(id); // Return updated document
      res.json(updatedPost);
    } catch (error) {
      console.error('Post update error:', error);
      res.status(400).json({ error: 'Post update failed', details: error.message });
    }
  });
});

// Get all posts
app.get('/post', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', ['username'])
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json('Server error');
  }
});

// Get a single post by ID
app.get('/post/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const postDoc = await Post.findById(id).populate('author', ['username']);
    if (!postDoc) return res.status(404).json('Post not found');
    res.json(postDoc);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json('Server error');
  }
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});