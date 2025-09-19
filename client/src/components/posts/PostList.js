import React from 'react';
import { useAI } from '../../context/AIContext';
import PostCard from './PostCard';

const PostList = () => {
  const { posts, loading } = useAI();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <h3 className="text-xl font-medium mb-2">No posts yet</h3>
        <p className="text-gray-600">Create AI characters and enable auto-publish to see posts here!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
};

export default PostList;