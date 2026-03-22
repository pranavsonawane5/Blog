import { useState, useEffect, useContext } from "react";
import { Navigate, useParams } from "react-router-dom";
import Editor from "../Editor";
import { UserContext } from "../UserContext";

export default function EditPost() {
  const { id } = useParams();
  const { userInfo } = useContext(UserContext);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState('');
  const [redirect, setRedirect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false); // New state for redirect

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/post/${id}`, { credentials: 'include' })
      .then(response => {
        if (!response.ok) throw new Error(`Failed to fetch post: ${response.status}`);
        return response.json();
      })
      .then(postInfo => {
        if (!userInfo?.id ||postInfo.author._id !== userInfo.id) {
          setUnauthorized(true); // Redirect instead of error
          setLoading(false);
          return;
        }
        setTitle(postInfo.title);
        setSummary(postInfo.summary);
        setContent(postInfo.content);
        setLoading(false);
      })
      .catch(error => {
        console.error('Fetch error:', error);
        setUnauthorized(true); // Redirect on fetch failure too
        setLoading(false);
      });
  }, [id, userInfo]);

  async function updatePost(ev) {
    ev.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.set('title', title);
    data.set('summary', summary);
    data.set('content', content);
    data.set('id', id);
    if (files?.[0]) {
      data.set('file', files[0]);
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/post`, {
        method: 'PUT',
        body: data,
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to update post');
      setRedirect(true);
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update post. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (redirect) {
    return <Navigate to={`/post/${id}`} />;
  }

  if (unauthorized) {
    return <Navigate to={`/post/${id}`} state={{ message: 'Only the author can edit this post.' }} />;
  }

  if (loading) {
    return <div>Checking permissions...</div>;
  }

  return (
    <form onSubmit={updatePost}>
      <input
        type="text"
        placeholder={'Title'}
        value={title}
        onChange={ev => setTitle(ev.target.value)}
      />
      <input
        type="text"
        placeholder={'Summary'}
        value={summary}
        onChange={ev => setSummary(ev.target.value)}
      />
      <input
        type="file"
        onChange={ev => setFiles(ev.target.files)}
      />
      <Editor value={content} onChange={setContent} />
      <button style={{ marginTop: '5px' }} disabled={loading}>
        {loading ? 'Updating...' : 'Update Post'}
      </button>
    </form>
  );
}