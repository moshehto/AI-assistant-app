//AppContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AppContext = createContext();

// Centralized state management
const initialState = {
  // Auth state
  isAuthenticated: false,
  authToken: null,
  refreshToken: null,
  userData: null,
  
  // App state
  conversations: ['default'],
  currentConversation: 'default',
  files: [],
  loading: false,
  error: null
};

function appReducer(state, action) {
  switch (action.type) {
    // Auth actions
    case 'SET_AUTH':
      return { 
        ...state, 
        isAuthenticated: true,
        authToken: action.payload.token,
        refreshToken: action.payload.refreshToken,
        userData: action.payload.userData 
      };
    case 'CLEAR_AUTH':
      return { 
        ...state, 
        isAuthenticated: false,
        authToken: null,
        refreshToken: null,
        userData: null 
      };
    
    // Conversation actions
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
    
    // UI state actions
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

  // Check for stored auth on mount
  useEffect(() => {
    const checkStoredAuth = async () => {
      const storedToken = localStorage.getItem('authToken');
      const storedRefreshToken = localStorage.getItem('refreshToken');
      const storedUser = localStorage.getItem('userData');
      
      if (storedToken && storedUser) {
        try {
          // Verify token is still valid
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://chatbot-backend-fwl6.onrender.com'}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });
          
          if (response.ok) {
            const profile = await response.json();
            dispatch({ 
              type: 'SET_AUTH', 
              payload: { 
                token: storedToken, 
                refreshToken: storedRefreshToken,
                userData: profile 
              } 
            });
            
            // ADDED: Send resize signal when already authenticated
            if (window.electronAPI?.send) {
              console.log('Sending auth-success signal for stored token');
              window.electronAPI.send('auth-success');
            }
          } else if (response.status === 401 && storedRefreshToken) {
            // Token expired, try to refresh
            console.log('Access token expired, attempting refresh...');
            const refreshResult = await refreshAuthToken(storedRefreshToken);
            if (refreshResult.success) {
              // Refresh successful, retry getting profile
              const retryResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://chatbot-backend-fwl6.onrender.com'}/auth/me`, {
                headers: {
                  'Authorization': `Bearer ${refreshResult.accessToken}`
                }
              });
              
              if (retryResponse.ok) {
                const profile = await retryResponse.json();
                dispatch({ 
                  type: 'SET_AUTH', 
                  payload: { 
                    token: refreshResult.accessToken, 
                    refreshToken: refreshResult.refreshToken,
                    userData: profile 
                  } 
                });
                
                if (window.electronAPI?.send) {
                  console.log('Sending auth-success signal after refresh');
                  window.electronAPI.send('auth-success');
                }
              }
            } else {
              // Refresh failed, clear storage
              localStorage.removeItem('authToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('userData');
            }
          } else {
            // Token expired and no refresh token, clear storage
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userData');
          }
        } catch (error) {
          console.error('Token validation failed:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userData');
        }
      }
    };

    checkStoredAuth();
  }, []);

  // Periodic token refresh - check every 5 minutes and refresh if token expires in next 10 minutes
  useEffect(() => {
    if (!state.authToken || !state.refreshToken) return;

    const checkTokenExpiry = async () => {
      try {
        // Decode JWT to check expiration (simple implementation)
        const payload = JSON.parse(atob(state.authToken.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = payload.exp - currentTime;

        // If token expires in less than 10 minutes (600 seconds), refresh it
        if (timeUntilExpiry < 600) {
          console.log('Token will expire soon, refreshing...');
          const refreshResult = await refreshAuthToken(state.refreshToken);
          if (!refreshResult.success) {
            console.log('Background token refresh failed, user will need to login again');
          }
        }
      } catch (error) {
        console.error('Error checking token expiry:', error);
      }
    };

    // Check immediately and then every 5 minutes
    checkTokenExpiry();
    const interval = setInterval(checkTokenExpiry, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [state.authToken, state.refreshToken]);

  // Helper function to refresh auth token
  const refreshAuthToken = async (refreshToken) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://chatbot-backend-fwl6.onrender.com'}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update stored tokens
        localStorage.setItem('authToken', data.access_token);
        localStorage.setItem('refreshToken', data.refresh_token);
        
        // Update state
        dispatch({ 
          type: 'SET_AUTH', 
          payload: { 
            token: data.access_token, 
            refreshToken: data.refresh_token,
            userData: state.userData 
          } 
        });
        
        return {
          success: true,
          accessToken: data.access_token,
          refreshToken: data.refresh_token
        };
      } else {
        console.error('Token refresh failed:', response.status);
        return { success: false };
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      return { success: false };
    }
  };

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    if (!state.authToken) return { 'Content-Type': 'application/json' };
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${state.authToken}`
    };
  };

  // Helper function to make authenticated API calls with automatic retry on 401
  const makeAuthenticatedRequest = async (url, options = {}) => {
    // First attempt with current token
    let response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers
      }
    });

    // If 401 and we have a refresh token, try to refresh and retry
    if (response.status === 401 && state.refreshToken) {
      console.log('Received 401, attempting token refresh...');
      const refreshResult = await refreshAuthToken(state.refreshToken);
      
      if (refreshResult.success) {
        console.log('Token refreshed successfully, retrying request...');
        // Retry the request with the new token
        response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${refreshResult.accessToken}`,
            ...options.headers
          }
        });
      } else {
        // Refresh failed, logout user
        console.log('Token refresh failed, logging out...');
        api.logout();
        throw new Error('Session expired. Please login again.');
      }
    }

    return response;
  };

  // Shared API functions that all windows can use
  const api = {
    // Auth functions
    async login(email, password) {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://chatbot-backend-fwl6.onrender.com'}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Login failed');
        }

        // Get user profile
        const profileResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://chatbot-backend-fwl6.onrender.com'}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${data.access_token}`
          }
        });

        if (profileResponse.ok) {
          const profile = await profileResponse.json();
          
          // Store auth data
          localStorage.setItem('authToken', data.access_token);
          localStorage.setItem('refreshToken', data.refresh_token);
          localStorage.setItem('userData', JSON.stringify(profile));
          
          dispatch({ 
            type: 'SET_AUTH', 
            payload: { 
              token: data.access_token, 
              refreshToken: data.refresh_token,
              userData: profile 
            } 
          });

          // Send resize signal to Electron
          if (window.electronAPI?.send) {
            window.electronAPI.send('auth-success');
          }

          return { success: true, data: { token: data.access_token, profile } };
        }

        throw new Error('Failed to get user profile');
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        return { success: false, error: error.message };
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    logout() {
      // Clear auth state
      dispatch({ type: 'CLEAR_AUTH' });
      
      // Clear storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userData');
      
      // Reset to auth window size if in Electron
      if (window.electronAPI?.send) {
        window.electronAPI.send('auth-logout');
      }
    },

    // Conversation functions
    async fetchConversations() {
      if (!state.authToken) {
        console.warn('No auth token available');
        return;
      }

      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const response = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_BASE_URL || 'https://chatbot-backend-fwl6.onrender.com'}/api/conversations`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch conversations: ${response.status}`);
        }
        
        const data = await response.json();
        dispatch({ type: 'SET_CONVERSATIONS', payload: data.conversations || [] });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    async addConversation(name) {
      if (!state.authToken) {
        console.warn('No auth token available');
        return;
      }

      try {
        const response = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_BASE_URL || 'https://chatbot-backend-fwl6.onrender.com'}/api/conversations`, {
          method: 'POST',
          body: JSON.stringify({ name })
        });
        
        if (response.ok) {
          dispatch({ type: 'ADD_CONVERSATION', payload: name });
          return { success: true };
        }
        
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create conversation');
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        return { success: false, error: error.message };
      }
    },

    async deleteConversation(conversationValue) {
      if (!state.authToken) {
        console.warn('No auth token available');
        return;
      }

      try {
        const response = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_BASE_URL || 'https://chatbot-backend-fwl6.onrender.com'}/api/conversations/${encodeURIComponent(conversationValue)}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          dispatch({ type: 'DELETE_CONVERSATION', payload: conversationValue });
          return { success: true };
        }
        
        const error = await response.json();
        throw new Error(error.detail || 'Failed to delete conversation');
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        return { success: false, error: error.message };
      }
    },

    // Utility functions
    setCurrentConversation(conversationValue) {
      dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: conversationValue });
    },

    // File functions
    async fetchFiles(conversation) {
      if (!state.authToken) {
        console.warn('No auth token available');
        return;
      }

      try {
        const response = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_BASE_URL || 'https://chatbot-backend-fwl6.onrender.com'}/api/files?conversation=${encodeURIComponent(conversation)}`);
        
        if (response.ok) {
          const data = await response.json();
          dispatch({ type: 'SET_FILES', payload: data.files || [] });
          return { success: true, files: data.files };
        }
        
        throw new Error('Failed to fetch files');
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        return { success: false, error: error.message };
      }
    },

    async deleteFile(fileId) {
      if (!state.authToken) {
        console.warn('No auth token available');
        return { success: false, error: 'Authentication required' };
      }

      try {
        const response = await makeAuthenticatedRequest(`${import.meta.env.VITE_API_BASE_URL || 'https://chatbot-backend-fwl6.onrender.com'}/api/files/${encodeURIComponent(fileId)}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          return { success: true };
        }
        
        const error = await response.json();
        throw new Error(error.detail || 'Failed to delete file');
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        return { success: false, error: error.message };
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