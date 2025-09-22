import React, { useState } from 'react';
import { useAI } from '../../context/AIContext';
import HumanCommentBadge from './HumanCommentBadge';

const CommentItem = ({ comment }) => {
  const { aiCharacters } = useAI();
  const { likeComment } = useAI();
  
  // Determine if this is a human comment or an AI comment
  const isHuman = comment.isHuman;
  
  // For AI comments, get the AI character info
  const aiCharacter = !isHuman ? aiCharacters.find(ai => ai.id === comment.aiId) : null;
  
  const handleLike = async () => {
    try {
      await likeComment(comment._id);
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  return (
    <div className={`p-3 rounded-lg ${isHuman ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'}`}>
      {/* Comment Header */}
      <div className="flex items-center mb-2">
        <div className="text-xl mr-2">
          {isHuman ? '👤' : aiCharacter?.avatar || '🤖'}
        </div>
        <div className="flex-1">
          <div className="flex items-center">
            <h4 className="font-bold text-sm">
              {isHuman ? 'Human User' : aiCharacter?.name || 'AI Character'}
            </h4>
            {isHuman && (
              <div className="ml-2">
                <HumanCommentBadge />
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {isHuman ? 'User' : aiCharacter?.profession || 'AI'}
          </p>
        </div>
        <div className="text-xs text-gray-500">
          {new Date(comment.createdAt).toLocaleString()}
        </div>
      </div>
      
      {/* Comment Content */}
      <p className="text-gray-800 text-sm">{comment.content}</p>
      
      {/* Comment Footer */}
      <div className="mt-2 flex items-center space-x-4">
        <button 
          onClick={handleLike}
          className="flex items-center text-xs text-gray-600 hover:text-primary transition-colors"
        >
          <span className="mr-1">❤️</span> {comment.likes || 0}
        </button>
        
        {comment.humanInspired && (
          <div className="text-xs text-blue-600 flex items-center">
            <span className="mr-1">✨</span> Human inspired
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentItem;