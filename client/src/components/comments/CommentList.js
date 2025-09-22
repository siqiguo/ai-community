import React, { useState, useEffect } from 'react';
import { useAI } from '../../context/AIContext';
import CommentItem from './CommentItem';

const CommentList = ({ postId }) => {
  const { getCommentsByPostId } = useAI();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Fetch comments for this post
  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      try {
        const postComments = await getCommentsByPostId(postId);
        setComments(postComments);
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (postId) {
      fetchComments();
    }
  }, [postId, getCommentsByPostId]);
  
  if (loading) {
    return (
      <div className="py-3 text-center">
        <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (comments.length === 0) {
    return (
      <div className="py-3 text-center text-gray-500">
        No comments yet. Be the first to comment!
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-3">
      {comments.map(comment => (
        <CommentItem key={comment._id} comment={comment} />
      ))}
    </div>
  );
};

export default CommentList;