import React, { useState, useEffect } from 'react';
import '../styling/conversationmanager.css';

export default function ConversationManager() {
  const [newConversationName, setNewConversationName] = useState('');
  const [localConversations, setLocalConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        if (value === 'default') {
          label = '🗂️ Default Conversation';
        } else {
          const name = value.replace(/_/g, ' ');
          label = `🆕 ${name}`;
        }
        return { label, value };
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
      const newConversation = { label: `🆕 ${trimmed}`, value };
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

    setLoading(true);
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

      // Refresh conversations from server to ensure sync
      setTimeout(() => fetchConversations(), 1000);

    } catch (err) {
      console.error('❌ Failed to delete conversation:', err);
      setError(`Failed to delete conversation: ${err.message}`);
      
      // Restore the conversation in local state if deletion failed
      fetchConversations();
    } finally {
      setLoading(false);
    }
  };

  const handleClearDefaultConversation = async () => {
    setLoading(true);
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
      
    } catch (err) {
      console.error('❌ Failed to clear default conversation:', err);
      setError(`Failed to clear default conversation: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <div className="conversation-manager-overlay">
      <div className="conversation-manager-modal">
        <div className="conversation-manager-header">
          <h3>🧠 Manage Conversations</h3>
          <button 
            className="refresh-btn"
            onClick={fetchConversations}
            disabled={loading}
            title="Refresh conversations"
          >
            {loading ? '⏳' : '🔄'}
          </button>
        </div>

        {error && (
          <div className={`error-message ${error.includes('successfully') ? 'success' : 'error'}`}>
            {error}
          </div>
        )}

        <div className="conversations-container">
          {loading && localConversations.length === 0 ? (
            <div className="loading-state">Loading Conversations...</div>
          ) : (
            <ul>
              {localConversations.map((conversation, i) => (
                <li key={i} className="conversation-item">
                  <span className="conversation-label">{conversation.label}</span>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(conversation.value)}
                    disabled={loading}
                    title={conversation.value === 'default' ? 'Clear default conversation files' : 'Delete conversation and all files'}
                  >
                    {conversation.value === 'default' ? '🗑️ Clear' : '🗑️'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="conversation-input">
          <input
            type="text"
            value={newConversationName}
            onChange={(e) => setNewConversationName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="New Conversation Name"
            disabled={loading}
          />
          <button 
            onClick={handleAdd}
            disabled={loading || !newConversationName.trim()}
          >
            {loading ? '⏳' : '➕ Add'}
          </button>
        </div>
        
        <div className="conversation-count">
          {localConversations.length} Conversation{localConversations.length !== 1 ? 's' : ''} total
        </div>
      </div>
    </div>
  );
}