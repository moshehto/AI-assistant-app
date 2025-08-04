import React, { useState, useEffect } from 'react';
import '../styling/conversationmanager.css';

export default function ConversationManager({ onClose }) {
  const [newConversationName, setNewConversationName] = useState('');
  const [localConversations, setLocalConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [deletingConversations, setDeletingConversations] = useState(new Set());

  const API_BASE = 'https://chatbot-backend-fwl6.onrender.com';

  // Fetch conversations from backend
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/api/conversations`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const conversations = data.conversations || [];
      
      // Map conversations to display format
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
      
    } catch (err) {
      console.error('❌ Failed to fetch conversations:', err);
      setError('Failed to load conversations from server');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    const trimmed = newConversationName.trim();
    if (!trimmed) return;

    const value = trimmed.toLowerCase().replace(/\s+/g, '_');
    const exists = localConversations.some(t => t.value === value);
    if (exists) {
      setError('Conversation already exists');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Add to backend
      const response = await fetch(`${API_BASE}/api/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: trimmed })
      });

      if (!response.ok) {
        throw new Error(`Failed to create conversation: ${response.statusText}`);
      }

      // Add to local state immediately for better UX
      const newConversation = { 
        label: trimmed, 
        value, 
        icon: '🗂️'
      };
      setLocalConversations(prev => [...prev, newConversation]);

      setNewConversationName('');
      
      // Refresh conversations from server to ensure sync
      setTimeout(() => fetchConversations(), 1000);

    } catch (err) {
      console.error('❌ Failed to add conversation:', err);
      setError(`Failed to create conversation: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (value) => {
    if (value === 'default') {
      // For default conversation, we'll clear its contents instead of deleting
      handleClearDefaultConversation();
      return;
    }

    setDeletingConversations(prev => new Set([...prev, value]));
    setError('');

    try {
      // Delete from backend
      const response = await fetch(`${API_BASE}/api/conversations/${encodeURIComponent(value)}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Failed to delete conversation: ${response.statusText}`);
      }

      // Remove from local state immediately
      setLocalConversations(prev => prev.filter(t => t.value !== value));
      setShowDeleteConfirm(null);

      // Refresh conversations from server to ensure sync
      setTimeout(() => fetchConversations(), 1000);

    } catch (err) {
      console.error('❌ Failed to delete conversation:', err);
      setError(`Failed to delete conversation: ${err.message}`);
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
    setError('');

    try {
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

      setError('Default conversation cleared successfully');
      setShowDeleteConfirm(null);
      
    } catch (err) {
      console.error('❌ Failed to clear default conversation:', err);
      setError(`Failed to clear default conversation: ${err.message}`);
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
            onClick={fetchConversations}
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
            <button onClick={() => setError('')} className="error-close">
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