import { Link, useLocation } from "react-router-dom";
import {useNavigate} from "react-router-dom";
import { useContext, useEffect } from "react";
import { UserContext } from "./UserContext.jsx";

export default function Header() {
  const { setUserInfo, userInfo } = useContext(UserContext);
  const location = useLocation();
  const naigate = useNavigate();

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/profile`, {
      credentials: 'include',
    })
      .then(response => {
      if (response.status === 200) return response.json();
       return null; 
      })
      .then(data => {
          setUserInfo(data);
      })
        .catch(() => setUserInfo(null));
  }, [setUserInfo]);

  function logout() {
    fetch(`${import.meta.env.VITE_API_URL}/logout`, {
      credentials: 'include',
      method: 'POST',
    }).then(response => {
      if (response.ok) {
        setUserInfo(null); // Clear user info
        naigate('/login'); // Immediate redirect to login
      } else {
        console.error('Logout failed:', response.status);
        alert('Logout failed. Please try again.');
      }
    }).catch(error => {
      console.error('Logout error:', error);
      alert('Logout failed due to a network error. Please try again.');
    });
  }

  const username = userInfo?.username;
  const isCreateOrEdit = location.pathname === '/create' || location.pathname.startsWith('/edit/');

  return (
    <header>
      <Link to="/" className="logo">MyBlog</Link>
      <nav>
        {username && (
          <>
          <span>Hello, {username}</span>
            {!isCreateOrEdit && (
              <Link to="/create">Create New Post</Link>
            )}
            <a onClick={logout}>Logout</a>
          </>
        )}
        {!username && (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
}