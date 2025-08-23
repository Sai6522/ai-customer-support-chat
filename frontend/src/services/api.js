import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  demoLogin: (credentials) => api.post('/auth/demo-login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
};

// Chat API
export const chatAPI = {
  sendMessage: (messageData) => api.post('/chat/message', messageData),
  getHistory: (sessionId, params = {}) => api.get(`/chat/history/${sessionId}`, { params }),
  getConversations: (params = {}) => api.get('/chat/conversations', { params }),
  closeConversation: (conversationId) => api.put(`/chat/conversation/${conversationId}/close`),
  rateConversation: (conversationId, ratingData) => api.post(`/chat/conversation/${conversationId}/rating`, ratingData),
  downloadChatTXT: (sessionId) => api.get(`/chat/download/${sessionId}/txt`, { 
    responseType: 'blob'
  }),
  downloadChatHTML: (sessionId) => api.get(`/chat/download/${sessionId}/html`),
  getSessions: (params = {}) => api.get('/chat/sessions', { params }),
  // Legacy support
  downloadChat: (sessionId, format = 'txt') => {
    if (format === 'txt') {
      return api.get(`/chat/download/${sessionId}/txt`, { responseType: 'blob' });
    } else {
      return api.get(`/chat/download/${sessionId}/html`);
    }
  },
  getStats: () => api.get('/chat/stats'),
  createSession: () => api.post('/chat/session'),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  
  // FAQ management
  createFAQ: (faqData) => api.post('/admin/faq', faqData),
  getFAQs: (params = {}) => api.get('/admin/faqs', { params }),
  updateFAQ: (id, faqData) => api.put(`/admin/faq/${id}`, faqData),
  deleteFAQ: (id) => api.delete(`/admin/faq/${id}`),
  
  // Company data management
  uploadCompanyData: (formData) => api.post('/admin/upload-company-data', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getCompanyData: (params = {}) => api.get('/admin/company-data', { params }),
  getCompanyDataById: (id) => api.get(`/admin/company-data/${id}`),
  updateCompanyData: (id, data) => api.put(`/admin/company-data/${id}`, data),
  deleteCompanyData: (id) => api.delete(`/admin/company-data/${id}`),
  
  // Conversation management
  getConversations: (params = {}) => api.get('/admin/conversations', { params }),
  getConversation: (id) => api.get(`/admin/conversation/${id}`),
  getConversationMessages: (id) => api.get(`/admin/conversation/${id}`),
  deleteConversation: (id) => api.delete(`/admin/conversation/${id}`),
  
  // User management
  getUsers: (params = {}) => api.get('/admin/users', { params }),
  createUser: (userData) => api.post('/admin/user', userData),
  updateUser: (id, userData) => api.put(`/admin/user/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/user/${id}`),
  
  // System health
  getSystemHealth: () => api.get('/admin/system/health'),
};

// Utility functions
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const isAuthenticated = () => {
  const token = getAuthToken();
  return !!token;
};

export default api;
