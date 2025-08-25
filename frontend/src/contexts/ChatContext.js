import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { chatAPI } from '../services/api';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

// Chat reducer
const chatReducer = (state, action) => {
  switch (action.type) {
    case 'SET_SESSION_ID':
      return {
        ...state,
        sessionId: action.payload,
      };
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'SET_TYPING':
      return {
        ...state,
        isTyping: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    case 'CLEAR_CHAT':
      return {
        ...state,
        messages: [],
        sessionId: null,
        error: null,
      };
    case 'SET_CONVERSATION_ID':
      return {
        ...state,
        conversationId: action.payload,
      };
    default:
      return state;
  }
};

// Initial state
const initialState = {
  messages: [],
  sessionId: null,
  conversationId: null,
  loading: false,
  isTyping: false,
  error: null,
};

// Chat provider component
export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { user, isAuthenticated } = useAuth();

  // Load chat history
  const loadChatHistory = useCallback(async (sessionId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await chatAPI.getHistory(sessionId);
      const messages = response.data.data.messages || [];
      
      dispatch({ type: 'SET_MESSAGES', payload: messages });
      
      if (response.data.data.conversationId) {
        dispatch({ type: 'SET_CONVERSATION_ID', payload: response.data.data.conversationId });
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load chat history' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Initialize session for specific user
  const initSessionForUser = useCallback(async (userId) => {
    try {
      // Check if there's an existing session for this user
      let sessionId = localStorage.getItem(`chatSessionId_${userId}`);
      
      if (!sessionId) {
        // Create new session for this user
        const response = await chatAPI.createSession();
        sessionId = response.data.data.sessionId;
        localStorage.setItem(`chatSessionId_${userId}`, sessionId);
      }

      dispatch({ type: 'SET_SESSION_ID', payload: sessionId });

      // Load existing messages for this session
      await loadChatHistory(sessionId);
    } catch (error) {
      console.error('Error initializing session for user:', error);
      // Fallback to generating UUID if API fails
      const fallbackSessionId = uuidv4();
      localStorage.setItem(`chatSessionId_${userId}`, fallbackSessionId);
      dispatch({ type: 'SET_SESSION_ID', payload: fallbackSessionId });
    }
  }, [loadChatHistory]);

  // Clear chat when user changes or logs out
  useEffect(() => {
    const clearChatForUserChange = () => {
      // Clear chat state
      dispatch({ type: 'CLEAR_CHAT' });
      
      // Remove old session from localStorage
      localStorage.removeItem('chatSessionId');
      
      // Clear any user-specific chat data
      const currentUserId = user?.id;
      if (currentUserId) {
        localStorage.removeItem(`chatSessionId_${currentUserId}`);
      }
    };

    // If user logs out, clear chat
    if (!isAuthenticated) {
      clearChatForUserChange();
      return;
    }

    // If user changes, clear chat and initialize new session
    if (user?.id) {
      const lastUserId = localStorage.getItem('lastUserId');
      const currentUserId = user.id;

      if (lastUserId && lastUserId !== currentUserId) {
        // User has changed, clear previous chat
        clearChatForUserChange();
      }

      // Store current user ID
      localStorage.setItem('lastUserId', currentUserId);
      
      // Initialize session for current user
      initSessionForUser(currentUserId);
    }
  }, [user, isAuthenticated, initSessionForUser]);

  // Initialize session on mount (for anonymous users or initial load)
  useEffect(() => {
    const initSession = async () => {
      // Skip if user is authenticated (handled by user effect above)
      if (isAuthenticated && user?.id) {
        return;
      }

      try {
        // For anonymous users, use general session
        let sessionId = localStorage.getItem('chatSessionId');
        
        if (!sessionId) {
          // Create new session
          const response = await chatAPI.createSession();
          sessionId = response.data.data.sessionId;
          localStorage.setItem('chatSessionId', sessionId);
        }

        dispatch({ type: 'SET_SESSION_ID', payload: sessionId });

        // Load existing messages for this session
        await loadChatHistory(sessionId);
      } catch (error) {
        console.error('Error initializing session:', error);
        // Fallback to generating UUID if API fails
        const fallbackSessionId = uuidv4();
        localStorage.setItem('chatSessionId', fallbackSessionId);
        dispatch({ type: 'SET_SESSION_ID', payload: fallbackSessionId });
      }
    };

    // Only initialize if not authenticated or no user
    if (!isAuthenticated || !user?.id) {
      initSession();
    }
  }, [isAuthenticated, user?.id, loadChatHistory]);

  // Send message
  const sendMessage = async (content) => {
    if (!content.trim() || !state.sessionId) return;

    // Add user message immediately
    const userMessage = {
      content: content.trim(),
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
    dispatch({ type: 'SET_TYPING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await chatAPI.sendMessage({
        message: content.trim(),
        sessionId: state.sessionId,
      });

      const botMessage = {
        content: response.data.data.message,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        metadata: response.data.data.metadata,
      };

      dispatch({ type: 'ADD_MESSAGE', payload: botMessage });
      
      if (response.data.data.conversationId) {
        dispatch({ type: 'SET_CONVERSATION_ID', payload: response.data.data.conversationId });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error.response?.data?.message || 'Failed to send message';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      // Add error message to chat
      const errorBotMessage = {
        content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        isError: true,
      };
      dispatch({ type: 'ADD_MESSAGE', payload: errorBotMessage });
    } finally {
      dispatch({ type: 'SET_TYPING', payload: false });
    }
  };

  // Start new chat
  const startNewChat = async () => {
    try {
      // Clear current state
      dispatch({ type: 'CLEAR_CHAT' });
      
      // Remove old session from localStorage
      const currentUserId = user?.id;
      if (currentUserId) {
        localStorage.removeItem(`chatSessionId_${currentUserId}`);
      } else {
        localStorage.removeItem('chatSessionId');
      }
      
      // Create new session
      const response = await chatAPI.createSession();
      const sessionId = response.data.data.sessionId;
      
      // Store session with user-specific key if authenticated
      if (currentUserId) {
        localStorage.setItem(`chatSessionId_${currentUserId}`, sessionId);
      } else {
        localStorage.setItem('chatSessionId', sessionId);
      }
      
      dispatch({ type: 'SET_SESSION_ID', payload: sessionId });
    } catch (error) {
      console.error('Error starting new chat:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to start new chat' });
    }
  };

  // Download chat history
  const downloadChat = async (format = 'txt') => {
    if (!state.sessionId) {
      dispatch({ type: 'SET_ERROR', payload: 'No active chat session to download' });
      return;
    }

    try {
      if (format === 'txt') {
        // Download as TXT file
        const response = await chatAPI.downloadChatTXT(state.sessionId);
        
        const blob = new Blob([response.data], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `chat_${state.sessionId}_${Date.now()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
      } else if (format === 'pdf') {
        // Download as PDF file
        const { downloadChatAsPDF } = await import('../utils/chatDownload');
        const result = await downloadChatAsPDF(state.sessionId);
        
        if (!result.success) {
          throw new Error(result.error);
        }
      }
      
    } catch (error) {
      console.error('Error downloading chat:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error.message || `Failed to download chat as ${format.toUpperCase()}` 
      });
    }
  };

  // Download chat as TXT
  const downloadChatTXT = async () => {
    await downloadChat('txt');
  };

  // Download chat as PDF
  const downloadChatPDF = async () => {
    await downloadChat('pdf');
  };

  // Rate conversation
  const rateConversation = async (rating, feedback = '') => {
    if (!state.conversationId) return;

    try {
      await chatAPI.rateConversation(state.conversationId, { rating, feedback });
      return { success: true };
    } catch (error) {
      console.error('Error rating conversation:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to submit rating' };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const value = {
    ...state,
    sendMessage,
    startNewChat,
    downloadChat,
    downloadChatTXT,
    downloadChatPDF,
    rateConversation,
    clearError,
    loadChatHistory,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook to use chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext;
