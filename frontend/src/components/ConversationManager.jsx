//ConversationManager.jsx
import React, { useState, useEffect } from 'react';
import { MessageCircle, RefreshCw, X, Trash2, Plus, Folder } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import '../styling/conversationmanager.css';

export default function ConversationManager() {
  const { state, api } = useApp();
  const [newConversationName, setNewConversationName] = useState('');
  const [localConversations, setLocalConversations] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [deletingConversations, setDeletingConversations] = useState(new Set());

  // Use shared state and API - GET AUTH TOKEN
  const { conversations, loading, error, authToken, currentConversation } = state; // ADDED: Get authToken and currentConversation
  
  // Debug log to see when currentConversation changes
  useEffect(() => {
    console.log('🔄 ConversationManager: currentConversation changed to:', currentConversation);
  }, [currentConversation]);

  // ADDED: Helper function to get auth headers
  const getAuthHeaders = () => {
    if (!authToken) {
      console.warn('No auth token available');
      return {};
    }
    return {
      'Authorization': `Bearer ${authToken}`
    };
  };

  // Fetch conversations and current conversation on mount using shared API
  useEffect(() => {
    if (authToken) { // ADDED: Only fetch if authenticated
      api.fetchConversations();
      
      // Get current conversation from Electron main process
      if (window.electronAPI?.getCurrentConversation) {
        window.electronAPI.getCurrentConversation().then((currentConv) => {
          if (currentConv) {
            api.setCurrentConversation(currentConv);
          }
        });
      }
    }
  }, [authToken]); // ADDED: authToken as dependency

  // Update local conversations when shared state changes
  useEffect(() => {
    const mapped = conversations.map(value => {
      let label;
      let icon;
      if (value === 'default') {
        label = 'Default Conversation';
        icon = '🗂️';
      } else {
        label = value.replace(/_/g, ' ');
        icon = '🗂️';
      }
      return { label, value, icon };
    });
    setLocalConversations(mapped);
  }, [conversations]);

  const handleAdd = async () => {
    const trimmed = newConversationName.trim();
    if (!trimmed) return;

    const value = trimmed.toLowerCase().replace(/\s+/g, '_');
    const exists = localConversations.some(t => t.value === value);
    if (exists) {
      // You could dispatch an error here if needed
      return;
    }

    try {
      await api.addConversation(trimmed);
      setNewConversationName('');
      // Refresh from server
      setTimeout(() => api.fetchConversations(), 1000);
    } catch (err) {
      console.error('Failed to add conversation:', err);
    }
  };

  const handleDelete = async (value) => {
    if (value === 'default') {
      handleClearDefaultConversation();
      return;
    }

    setDeletingConversations(prev => new Set([...prev, value]));

    try {
      await api.deleteConversation(value);
      setShowDeleteConfirm(null);
      setTimeout(() => api.fetchConversations(), 1000);
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    } finally {
      setDeletingConversations(prev => {
        const newSet = new Set(prev);
        newSet.delete(value);
        return newSet;
      });
    }
  };

  const handleClearDefaultConversation = async () => {
    setDeletingConversations(prev => new Set([...prev, 'default']));

    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://chatbot-backend-fwl6.onrender.com';
      // Get all files for default conversation and delete them
      const filesResponse = await fetch(
        `${API_BASE}/api/files?conversation=default`,
        {
          headers: getAuthHeaders() // ADDED: Include auth headers
        }
      );
      
      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        const files = filesData.files || [];

        // Delete each file
        for (const file of files) {
          try {
            await fetch(
              `${API_BASE}/api/files/${encodeURIComponent(file.id)}`,
              {
                method: 'DELETE',
                headers: getAuthHeaders() // ADDED: Include auth headers
              }
            );
          } catch (fileErr) {
            console.error(`Failed to delete file ${file.name}:`, fileErr);
          }
        }
      }

      setShowDeleteConfirm(null);
      
    } catch (err) {
      console.error('❌ Failed to clear default conversation:', err);
    } finally {
      setDeletingConversations(prev => {
        const newSet = new Set(prev);
        newSet.delete('default');
        return newSet;
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  const handleSelectConversation = (conversationValue) => {
    console.log('🔍 Selecting conversation:', conversationValue);
    
    // Update the current conversation in AppContext
    api.setCurrentConversation(conversationValue);
    
    // Send message to Electron main process to update conversation in floating bar
    if (window.electronAPI?.setCurrentConversation) {
      window.electronAPI.setCurrentConversation(conversationValue);
    }
    
    // Close the conversation manager window
    if (window.electronAPI?.closeWindow) {
      window.electronAPI.closeWindow();
    }
  };

  const getConversationIcon = (type) => {
    return type === 'default' ? <Folder className="conversation-type-icon" /> : <MessageCircle className="conversation-type-icon" />;
  };

  /* ADDED: Check if authenticated
  if (!authToken) {
    return (
      <div className="conversation-manager">
        <div className="content">
          <div className="empty-state">
            <p>⚠️ Please login first to manage conversations.</p>
          </div>
        </div>
      </div>
    );
  }
  */

  return (
    <div className="private-conversation-manager">
      {/* Header */}
      <div className="private-header">
        <h1 className="private-title">Private.ly Conversations</h1>
        <p className="private-subtitle">Organize and manage your conversation topics</p>
      </div>

      {/* Controls */}
      <div className="private-content">
        <div className="private-section-header">
          <h2 className="private-section-title">Conversations</h2>
          <div className="private-conversation-controls">
            <div className="private-add-conversation">
              <input
                type="text"
                value={newConversationName}
                onChange={(e) => setNewConversationName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter conversation name..."
                disabled={loading}
                className="private-conversation-input"
              />
              <button 
                onClick={handleAdd}
                disabled={loading || !newConversationName.trim()}
                className="private-add-button"
              >
                <Plus size={16} />
                Add
              </button>
            </div>
            <button
              onClick={() => api.fetchConversations()}
              disabled={loading}
              className="private-refresh-button"
            >
              <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="private-error-banner">
            <span>{error}</span>
            <button onClick={() => {/* dispatch clear error if needed */}} className="private-error-close">
              <X size={16} />
            </button>
          </div>
        )}

        {loading && localConversations.length === 0 ? (
          <div className="private-loading">
            <RefreshCw className="spinning" size={24} />
            <p>Loading conversations...</p>
          </div>
        ) : localConversations.length === 0 ? (
          <div className="private-empty-state">
            <MessageCircle size={48} className="private-empty-icon" />
            <p>No conversations found</p>
            <p>Create your first conversation to get started</p>
          </div>
        ) : (
          <div className="private-conversations-grid">
            {localConversations.map((conversation, i) => (
              <div key={i} className="private-conversation-card">
                <div className="private-conversation-header">
                  {getConversationIcon(conversation.value)}
                  <div className="private-conversation-badge">
                    {conversation.value === 'default' ? (
                      <span className="private-default-badge">Default</span>
                    ) : (
                      <span className="private-custom-badge">Custom</span>
                    )}
                  </div>
                </div>
                <div className="private-conversation-name" title={conversation.label}>
                  {conversation.label}
                </div>
                <div className="private-conversation-actions">
                  <button
                    className={`private-select-button ${
                      conversation.value === currentConversation ? 'current-conversation' : ''
                    }`}
                    onClick={() => handleSelectConversation(conversation.value)}
                    disabled={conversation.value === currentConversation}
                    title={conversation.value === currentConversation ? 'Currently selected conversation' : 'Select this conversation'}
                  >
                    {conversation.value === currentConversation ? 'Selected' : 'Select'}
                  </button>
                  <button
                    className="private-delete-button"
                    onClick={() => setShowDeleteConfirm(conversation.value)}
                    disabled={deletingConversations.has(conversation.value)}
                    title={conversation.value === 'default' ? 'Clear default conversation files' : 'Delete conversation and all files'}
                  >
                    {deletingConversations.has(conversation.value) ? (
                      <RefreshCw size={14} className="spinning" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    {conversation.value === 'default' ? 'Clear' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="private-modal">
            <div className="private-modal-content">
              <div className="private-modal-header">
                <h3>
                  {showDeleteConfirm === 'default' ? 'Clear Conversation' : 'Delete Conversation'}
                </h3>
                <button 
                  className="private-modal-close"
                  onClick={() => setShowDeleteConfirm(null)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="private-modal-body">
                <p>
                  {showDeleteConfirm === 'default' 
                    ? 'Clear all files from the default conversation? This cannot be undone.'
                    : 'Delete this conversation and all associated files? This cannot be undone.'
                  }
                </p>
                
                <div className="private-modal-actions">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="private-cancel-button"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(showDeleteConfirm)}
                    disabled={deletingConversations.has(showDeleteConfirm)}
                    className="private-delete-confirm-button"
                  >
                    {deletingConversations.has(showDeleteConfirm) ? (
                      <>
                        <RefreshCw size={14} className="spinning" />
                        {showDeleteConfirm === 'default' ? 'Clearing...' : 'Deleting...'}
                      </>
                    ) : (
                      showDeleteConfirm === 'default' ? 'Clear Files' : 'Delete Conversation'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}