import React, { createContext, useContext, useState, useEffect, useReducer } from 'react';

// Initial state
const initialState = {
  aiCharacters: [],
  posts: [],
  comments: [],
  loading: false,
  error: null,
  stats: {
    totalAI: 0,
    totalPosts: 0,
    totalComments: 0,
    humanInteractions: 0
  }
};

// Create reducer function
const aiReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_AI_CHARACTERS':
      return { 
        ...state, 
        aiCharacters: action.payload,
        stats: { ...state.stats, totalAI: action.payload.length }
      };
    case 'ADD_AI_CHARACTER':
      return { 
        ...state, 
        aiCharacters: [...state.aiCharacters, action.payload],
        stats: { ...state.stats, totalAI: state.stats.totalAI + 1 }
      };
    case 'SET_POSTS':
      return { 
        ...state, 
        posts: action.payload,
        stats: { ...state.stats, totalPosts: action.payload.length }
      };
    case 'ADD_POST':
      return { 
        ...state, 
        posts: [action.payload, ...state.posts],
        stats: { ...state.stats, totalPosts: state.stats.totalPosts + 1 }
      };
    case 'ADD_COMMENT':
      return { 
        ...state, 
        comments: [...state.comments, action.payload],
        stats: { 
          ...state.stats, 
          totalComments: state.stats.totalComments + 1,
          humanInteractions: action.payload.isHuman ? state.stats.humanInteractions + 1 : state.stats.humanInteractions
        }
      };
    default:
      return state;
  }
};

// Create context
const AIContext = createContext();

// Create provider component
export const AIContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(aiReducer, initialState);

  // Example of a function to create an AI character
  const createAICharacter = async (characterData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // For now, we'll just mock this
      // In a real app, this would be an API call
      const newCharacter = {
        id: Date.now().toString(),
        ...characterData,
        avatar: '🤖', // We'll make this dynamic later
        createdAt: new Date().toISOString()
      };
      
      dispatch({ type: 'ADD_AI_CHARACTER', payload: newCharacter });
      dispatch({ type: 'SET_LOADING', payload: false });
      return newCharacter;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return null;
    }
  };

  // Example of a function to create a post
  const createPost = async (postData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // For now, we'll just mock this
      // In a real app, this would be an API call
      const newPost = {
        id: Date.now().toString(),
        ...postData,
        likes: 0,
        comments: [],
        createdAt: new Date().toISOString()
      };
      
      dispatch({ type: 'ADD_POST', payload: newPost });
      dispatch({ type: 'SET_LOADING', payload: false });
      return newPost;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return null;
    }
  };

  // Example of a function to add a comment
  const addComment = async (commentData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // For now, we'll just mock this
      // In a real app, this would be an API call
      const newComment = {
        id: Date.now().toString(),
        ...commentData,
        likes: 0,
        createdAt: new Date().toISOString()
      };
      
      dispatch({ type: 'ADD_COMMENT', payload: newComment });
      
      // Update the post with the new comment
      const updatedPosts = state.posts.map(post => {
        if (post.id === commentData.postId) {
          return {
            ...post,
            comments: [...post.comments, newComment.id]
          };
        }
        return post;
      });
      
      dispatch({ type: 'SET_POSTS', payload: updatedPosts });
      dispatch({ type: 'SET_LOADING', payload: false });
      return newComment;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return null;
    }
  };

  // Values to be provided to consumers
  const value = {
    ...state,
    createAICharacter,
    createPost,
    addComment
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
};

// Custom hook for easy context consumption
export const useAI = () => {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIContextProvider');
  }
  return context;
};