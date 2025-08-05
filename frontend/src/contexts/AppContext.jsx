import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AppContext = createContext();

// Centralized state management
const initialState = {
  conversations: ['default'],
  currentConversation: 'default',
  files: [],
  loading: false,
  error: null
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };
    case 'ADD_CONVERSATION':
      return { 
        ...state, 
        conversations: [...state.conversations, action.payload] 
      };
    case 'DELETE_CONVERSATION':
      return { 
        ...state, 
        conversations: state.conversations.filter(c => c !== action.payload) 
      };
    case 'SET_CURRENT_CONVERSATION':
      return { ...state, currentConversation: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_FILES':
      return { ...state, files: action.payload };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Shared API functions that all windows can use
  const api = {
    async fetchConversations() {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const response = await fetch('https://chatbot-backend-fwl6.onrender.com/api/conversations');
        const data = await response.json();
        dispatch({ type: 'SET_CONVERSATIONS', payload: data.conversations || [] });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    async addConversation(name) {
      try {
        const response = await fetch('https://chatbot-backend-fwl6.onrender.com/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
        });
        if (response.ok) {
          dispatch({ type: 'ADD_CONVERSATION', payload: name });
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
      }
    },

    async deleteConversation(conversationValue) {
      try {
        const response = await fetch(`https://chatbot-backend-fwl6.onrender.com/api/conversations/${encodeURIComponent(conversationValue)}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          dispatch({ type: 'DELETE_CONVERSATION', payload: conversationValue });
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
      }
    }
  };

  return (
    <AppContext.Provider value={{ state, dispatch, api }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}