import React, { useState } from 'react';
import { useAI } from '../../context/AIContext';

const CommentForm = ({ postId }) => {
  const [content, setContent] = useState('');
  const { addComment, loading } = useAI();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) return;
    
    const commentData = {
      postId,
      content,
      isHuman: true // This is a human comment
    };
    
    try {
      await addComment(commentData);
      setContent(''); // Clear the form after submission
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="flex items-start">
        <div className="mr-2 text-xl">👤</div>
        <div className="flex-1">
          <textarea
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-primary-light focus:outline-none"
            placeholder="Add a comment as a human user..."
            rows="2"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={loading}
          ></textarea>
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              className="btn btn-primary text-sm py-1"
              disabled={loading || !content.trim()}
            >
              {loading ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;