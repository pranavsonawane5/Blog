import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { formatISO9075 } from "date-fns";
import {UserContext} from "../UserContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencil } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

export default function PostPage (){
    const [postInfo, setPostInfo] = useState(null);
    const {userInfo} = useContext(UserContext);
    const {id} = useParams(); 
    useEffect (() => {       
        fetch(`${import.meta.env.VITE_API_URL}/post/${id}`)
        .then(response =>{
            response.json().then(postInfo => {
                setPostInfo(postInfo);
            });
        });
    },[id]);

    if(!postInfo) return <div>Loading...</div>;

   return (
    <div className = "post-page">
        <h1>{postInfo?.title}</h1>
        {postInfo.createdAt && (
            <time>{formatISO9075(new Date(postInfo.createdAt))}</time>
        )}
        <div className="author"> by {postInfo?.author?.username}</div>
        {userInfo?.id && postInfo?.author?._id && userInfo.id === postInfo.author._id && (
           <div className="edit-row">
            <Link className="edit-btn" to={`/edit/${postInfo._id}`}>
            <FontAwesomeIcon icon={faPencil} />    
                Edit this Post
            </Link>
           </div>
        )}
        <div className="image"> 
            <img src = {`${import.meta.env.VITE_API_URL}/${postInfo.cover}`} alt=""/>
        </div>
        <div className="content" dangerouslySetInnerHTML={{__html:postInfo.content}}/>
    </div>
   ); 
}