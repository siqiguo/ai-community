import React, { createContext, useContext, useState, useEffect, useReducer } from 'react';
import { aiCharacterApi, postApi, commentApi, automationApi } from '../services/api';

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
    case 'SET_COMMENTS':
      return {
        ...state,
        comments: action.payload,
        stats: { ...state.stats, totalComments: action.payload.length }
      };
    case 'UPDATE_POST':
      return {
        ...state,
        posts: state.posts.map(post => 
          post._id === action.payload._id ? action.payload : post
        )
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

  // Load initial data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // Get AI characters
        const characters = await aiCharacterApi.getAll();
        dispatch({ type: 'SET_AI_CHARACTERS', payload: characters });
        
        // Get posts
        const posts = await postApi.getAll();
        dispatch({ type: 'SET_POSTS', payload: posts });
        
        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (error) {
        console.error('Error loading initial data:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
      }
    };
    
    loadData();
  }, []);
  
  // Function to create an AI character
  const createAICharacter = async (characterData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Make API call to create character
      const newCharacter = await aiCharacterApi.create(characterData);
      
      dispatch({ type: 'ADD_AI_CHARACTER', payload: newCharacter });
      dispatch({ type: 'SET_LOADING', payload: false });
      return newCharacter;
    } catch (error) {
      console.error('Error creating AI character:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return null;
    }
  };

  // Function to create a post
  const createPost = async (postData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Transform aiId to aiCharacterId for API
      const apiPostData = {
        aiCharacterId: postData.aiId,
        content: postData.content,
        humanInspired: postData.humanInspired || false,
        inspirationSource: postData.inspirationSource || ''
      };
      
      // Make API call to create post
      const newPost = await postApi.create(apiPostData);
      
      dispatch({ type: 'ADD_POST', payload: newPost });
      dispatch({ type: 'SET_LOADING', payload: false });
      return newPost;
    } catch (error) {
      console.error('Error creating post:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return null;
    }
  };

  // Function to add a comment
  const addComment = async (commentData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Transform data for API
      const apiCommentData = {
        postId: commentData.postId,
        content: commentData.content,
        isHuman: commentData.isHuman || true,
        aiCharacterId: commentData.aiId || null,
        parentCommentId: commentData.parentCommentId || null
      };
      
      // Make API call to create comment
      const newComment = await commentApi.create(apiCommentData);
      
      dispatch({ type: 'ADD_COMMENT', payload: newComment });
      dispatch({ type: 'SET_LOADING', payload: false });
      return newComment;
    } catch (error) {
      console.error('Error adding comment:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return null;
    }
  };
  
  // Function to like a post
  const likePost = async (postId) => {
    try {
      // Make API call to like post
      const updatedPost = await postApi.like(postId, true);
      
      // Update state
      dispatch({ type: 'UPDATE_POST', payload: updatedPost });
      return updatedPost;
    } catch (error) {
      console.error('Error liking post:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return null;
    }
  };
  
  // Function to like a comment
  const likeComment = async (commentId) => {
    try {
      // Make API call to like comment
      const updatedComment = await commentApi.like(commentId, true);
      
      // We're not currently tracking individual comment updates in state
      // This could be added if needed
      return updatedComment;
    } catch (error) {
      console.error('Error liking comment:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return null;
    }
  };
  
  // Function to fetch comments for a post
  const getCommentsByPostId = async (postId) => {
    try {
      const comments = await commentApi.getByPost(postId);
      return comments;
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  };
  
  // Function to trigger AI post generation
  const generateAIPosts = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Call API to trigger post generation
      const result = await automationApi.triggerAction('generate-posts');
      
      // Refresh posts
      const posts = await postApi.getAll();
      dispatch({ type: 'SET_POSTS', payload: posts });
      
      dispatch({ type: 'SET_LOADING', payload: false });
      return result;
    } catch (error) {
      console.error('Error generating AI posts:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return null;
    }
  };
  
  // Function to trigger AI interactions
  const generateAIInteractions = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Call API to trigger interactions
      const result = await automationApi.triggerAction('generate-interactions');
      
      // Refresh posts
      const posts = await postApi.getAll();
      dispatch({ type: 'SET_POSTS', payload: posts });
      
      dispatch({ type: 'SET_LOADING', payload: false });
      return result;
    } catch (error) {
      console.error('Error generating AI interactions:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return null;
    }
  };
  
  // Function to update automation settings
  const updateAutomationSettings = async (settings) => {
    try {
      const updatedSettings = await automationApi.updateSettings(settings);
      return updatedSettings;
    } catch (error) {
      console.error('Error updating automation settings:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return null;
    }
  };
  
  // Function to reset automation settings to defaults
  const resetAutomationSettings = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const result = await automationApi.resetSettings();
      dispatch({ type: 'SET_LOADING', payload: false });
      return result;
    } catch (error) {
      console.error('Error resetting automation settings:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      dispatch({ type: 'SET_LOADING', payload: false });
      return null;
    }
  };

  // Values to be provided to consumers
  const value = {
    ...state,
    createAICharacter,
    createPost,
    addComment,
    likePost,
    likeComment,
    getCommentsByPostId,
    generateAIPosts,
    generateAIInteractions,
    updateAutomationSettings,
    resetAutomationSettings
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