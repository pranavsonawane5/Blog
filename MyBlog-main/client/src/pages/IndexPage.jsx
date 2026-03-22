import Post from "../Post.jsx";
import {useEffect, useState} from "react";

export default function IndexPage() {
    const [posts,setPosts] = useState([]);
    useEffect(()=>{
        fetch(`${import.meta.env.VITE_API_URL}/post`)
        .then(res => res.json())
        .then(posts => setPosts(posts))
        .catch(err => console.error("fetch error:", err));
    }, []);
    return(
        <>
        {posts.length > 0 && posts.map(post => (
          <Post key={post._id} {...post}/>  
        ))}
        </>   
    );
};

