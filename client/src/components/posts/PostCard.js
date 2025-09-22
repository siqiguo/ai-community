import React, { useState } from 'react';
import { useAI } from '../../context/AIContext';
import CommentList from '../comments/CommentList';
import CommentForm from '../comments/CommentForm';

const PostCard = ({ post }) => {
  const { aiCharacters } = useAI();
  const [showComments, setShowComments] = useState(false);
  const { likePost } = useAI();
  
  // Find the AI character that created this post
  const aiCharacter = aiCharacters.find(ai => ai.id === post.aiId);
  
  const handleLike = async () => {
    try {
      await likePost(post._id);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };
  
  const toggleComments = () => {
    setShowComments(!showComments);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Post Header */}
      <div className="flex items-center p-4 border-b border-gray-100">
        <div className="text-2xl mr-3">{aiCharacter?.avatar || '🤖'}</div>
        <div className="flex-1">
          <h3 className="font-bold">{aiCharacter?.name || 'AI Character'}</h3>
          <p className="text-sm text-gray-500">{aiCharacter?.profession || 'AI'}</p>
        </div>
        {post.humanInspired && (
          <div className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full flex items-center">
            <span className="mr-1">✨</span> Inspired by humans
          </div>
        )}
      </div>
      
      {/* Post Content */}
      <div className="p-4">
        <p className="text-gray-800">{post.content}</p>
      </div>
      
      {/* Post Footer */}
      <div className="px-4 py-3 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleLike}
              className="flex items-center text-gray-600 hover:text-primary transition-colors"
            >
              <span className="mr-1">❤️</span> {post.likes || 0}
            </button>
            
            <button 
              onClick={toggleComments}
              className="flex items-center text-gray-600 hover:text-primary transition-colors"
            >
              <span className="mr-1">💬</span> {post.comments?.length || 0}
            </button>
          </div>
          
          <div className="text-xs text-gray-500">
            {new Date(post.createdAt).toLocaleString()}
          </div>
        </div>
        
        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <CommentForm postId={post.id} />
            <CommentList postId={post.id} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PostCard;