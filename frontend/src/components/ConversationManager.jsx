import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import '../styling/conversationmanager.css';

export default function ConversationManager({ onClose }) {
  const { state, api } = useApp();
  const [newConversationName, setNewConversationName] = useState('');
  const [localConversations, setLocalConversations] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [deletingConversations, setDeletingConversations] = useState(new Set());

  // Use shared state and API
  const { conversations, loading, error } = state;

  // Fetch conversations on mount using shared API
  useEffect(() => {
    api.fetchConversations();
  }, []);

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
      const API_BASE = 'https://chatbot-backend-fwl6.onrender.com';
      // Get all files for default conversation and delete them
      const filesResponse = await fetch(`${API_BASE}/api/files?conversation=default`);
      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        const files = filesData.files || [];

        // Delete each file
        for (const file of files) {
          try {
            await fetch(`${API_BASE}/api/files/${encodeURIComponent(file.id)}`, {
              method: 'DELETE'
            });
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

  const getConversationIcon = (type) => {
    return type === 'default' ? '🗂️' : '🗂️';
  };

  return (
    <div className="conversation-manager">
      {/* Native-style Header */}
      <div className="header">
        <div className="header-row">
          <h1 className="title">Conversation Manager</h1>
          <button
            onClick={() => api.fetchConversations()}
            disabled={loading}
            className={`refresh-btn ${loading ? 'disabled' : ''}`}
          >
            <span className={`refresh-icon ${loading ? 'spinning' : ''}`}>🔄</span>
            Refresh
          </button>
        </div>
        
        <div className="add-conversation-row">
          <input
            type="text"
            value={newConversationName}
            onChange={(e) => setNewConversationName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter conversation name..."
            disabled={loading}
            className="conversation-input"
          />
          <button 
            onClick={handleAdd}
            disabled={loading || !newConversationName.trim()}
            className={`add-btn ${(loading || !newConversationName.trim()) ? 'disabled' : ''}`}
          >
            + Add
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="content">
        {error && (
          <div className={`error-alert ${error.includes('successfully') ? 'success-alert' : ''}`}>
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
            <button onClick={() => {/* dispatch clear error if needed */}} className="error-close">
              ✕
            </button>
          </div>
        )}

        {loading && localConversations.length === 0 ? (
          <div className="loading-state">
            <span className="loading-icon spinning">🔄</span>
            <p>Loading...</p>
          </div>
        ) : (
          <div className="conversations-container">
            <div className="conversations-content">
              <div className="conversations-count">{localConversations.length} conversations</div>
              
              {localConversations.length === 0 ? (
                <div className="empty-state">
                  <p>No conversations found</p>
                </div>
              ) : (
                <div className="conversations-list">
                  {localConversations.map((conversation, i) => (
                    <div key={i} className="conversation-card">
                      <div className="conversation-content">
                        <div className="conversation-header">
                          <div className="conversation-info">
                            <span className="conversation-icon">
                              {getConversationIcon(conversation.value)}
                            </span>
                            <div className="conversation-details">
                              <div className="conversation-name" title={conversation.label}>
                                {conversation.label}
                              </div>
                              {conversation.value === 'default' && (
                                <div className="conversation-type">DEFAULT</div>
                              )}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => setShowDeleteConfirm(conversation.value)}
                            disabled={deletingConversations.has(conversation.value)}
                            className={`delete-btn ${deletingConversations.has(conversation.value) ? 'disabled' : ''}`}
                            title={conversation.value === 'default' ? 'Clear default conversation files' : 'Delete conversation and all files'}
                          >
                            {deletingConversations.has(conversation.value) ? (
                              <span className="spinning">🔄</span>
                            ) : (
                              conversation.value === 'default' ? '🗑️' : '❌'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Simple Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <span className="warning-icon">⚠️</span>
                <h3 className="modal-title">
                  {showDeleteConfirm === 'default' ? 'Clear Conversation' : 'Delete Conversation'}
                </h3>
              </div>
              
              <p className="modal-text">
                {showDeleteConfirm === 'default' 
                  ? 'Clear all files from the default conversation? This cannot be undone.'
                  : 'Delete this conversation and all associated files? This cannot be undone.'
                }
              </p>
              
              <div className="modal-actions">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  disabled={deletingConversations.has(showDeleteConfirm)}
                  className={`delete-confirm-btn ${deletingConversations.has(showDeleteConfirm) ? 'disabled' : ''}`}
                >
                  {deletingConversations.has(showDeleteConfirm) 
                    ? (showDeleteConfirm === 'default' ? 'Clearing...' : 'Deleting...') 
                    : (showDeleteConfirm === 'default' ? 'Clear' : 'Delete')
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}