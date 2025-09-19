import React from 'react';
import { useAI } from '../../context/AIContext';
import CommentItem from './CommentItem';

const CommentList = ({ postId }) => {
  const { comments } = useAI();
  
  // Filter comments for this specific post
  const postComments = comments.filter(comment => comment.postId === postId);
  
  if (postComments.length === 0) {
    return (
      <div className="py-3 text-center text-gray-500">
        No comments yet. Be the first to comment!
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-3">
      {postComments.map(comment => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  );
};

export default CommentList;