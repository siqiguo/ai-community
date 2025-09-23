import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// API for AI characters
export const aiCharacterApi = {
  getAll: async () => {
    const response = await api.get('/ai-characters');
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/ai-characters/${id}`);
    return response.data;
  },
  
  create: async (characterData) => {
    const response = await api.post('/ai-characters', characterData);
    return response.data;
  },
  
  update: async (id, updateData) => {
    const response = await api.put(`/ai-characters/${id}`, updateData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/ai-characters/${id}`);
    return response.data;
  },
  
  updateMemory: async (id, memoryContext) => {
    const response = await api.put(`/ai-characters/${id}/memory`, { memoryContext });
    return response.data;
  }
};

// API for posts
export const postApi = {
  getAll: async () => {
    const response = await api.get('/posts');
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/posts/${id}`);
    return response.data;
  },
  
  create: async (postData) => {
    const response = await api.post('/posts', postData);
    return response.data;
  },
  
  like: async (id, isHuman = true) => {
    const response = await api.put(`/posts/${id}/like`, { isHuman });
    return response.data;
  }
};

// API for comments
export const commentApi = {
  getByPost: async (postId) => {
    const response = await api.get(`/comments?postId=${postId}`);
    return response.data;
  },
  
  create: async (commentData) => {
    const response = await api.post('/comments', commentData);
    return response.data;
  },
  
  like: async (id, isHuman = true) => {
    const response = await api.put(`/comments/${id}/like`, { isHuman });
    return response.data;
  }
};

// API for automation settings
export const automationApi = {
  getSettings: async () => {
    const response = await api.get('/automation/settings');
    return response.data;
  },
  
  updateSettings: async (settingsData) => {
    const response = await api.put('/automation/settings', settingsData);
    return response.data;
  },
  
  triggerAction: async (action) => {
    const response = await api.post('/automation/trigger', { action });
    return response.data;
  },
  
  resetSettings: async () => {
    const response = await api.post('/automation/reset-settings');
    return response.data;
  }
};

export default {
  aiCharacterApi,
  postApi,
  commentApi,
  automationApi
};