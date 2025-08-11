//FileManager.jsx
import React, { useState, useEffect } from 'react';
import { Trash2, RefreshCw, AlertTriangle, Check, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import '../styling/filemanager.css';

const S3FileManager = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedconversation, setSelectedconversation] = useState('');
  const [localConversations, setLocalConversations] = useState([]);
  const [deletingFiles, setDeletingFiles] = useState(new Set());
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Access shared state and API - GET AUTH TOKEN
  const { state, api } = useApp();
  const { conversations, authToken } = state; // ADDED: Get authToken from state

  // API Base URL - Render hosted backend
  const API_BASE = 'https://chatbot-backend-fwl6.onrender.com';

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

  useEffect(() => {
    // Fetch conversations on mount using shared API
    const loadConversations = async () => {
      if (authToken) {
        await api.fetchConversations();
        
        // Force a re-fetch after a short delay if no conversations
        setTimeout(async () => {
          if (conversations.length === 0) {
            console.log('FileManager - Re-fetching conversations...');
            await api.fetchConversations();
          }
        }, 500);
      }
    };
    loadConversations();
  }, [authToken]);

  // Update local conversations when shared state changes
  useEffect(() => {
    console.log('FileManager - Conversations from state:', conversations); // Debug log
    if (conversations && conversations.length > 0) {
      setLocalConversations(conversations);
      
      // If no conversation is selected and we have conversations, select the first one
      if (!selectedconversation && conversations.length > 0) {
        setSelectedconversation(conversations[0]);
      }
    }
  }, [conversations]);

  useEffect(() => {
    if (selectedconversation && authToken) { // ADDED: Check for authToken
      loadFiles();
    }
  }, [selectedconversation, authToken]); // ADDED: authToken as dependency

  const loadFiles = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `${API_BASE}/api/files?conversation=${encodeURIComponent(selectedconversation)}`,
        {
          headers: getAuthHeaders() // ADDED: Include auth headers
        }
      );
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication required. Please login again.');
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setFiles(data.files || []);
    } catch (err) {
      setError('Failed to load files');
      console.error('Error loading files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    setDeletingFiles(prev => new Set([...prev, fileId]));
    try {
      const response = await fetch(
        `${API_BASE}/api/files/${encodeURIComponent(fileId)}`, 
        { 
          method: 'DELETE',
          headers: getAuthHeaders() // ADDED: Include auth headers
        }
      );
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication required. Please login again.');
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      setFiles(prev => prev.filter(file => file.id !== fileId));
      setShowDeleteConfirm(null);
    } catch (err) {
      setError('Failed to delete file');
      console.error('Error deleting file:', err);
    } finally {
      setDeletingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
  };

  const getFileIcon = (type) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📊';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📈';
    if (type.includes('word') || type.includes('document')) return '📝';
    return '📄';
  };

  const truncateFilename = (name, maxLength = 18) => {
    if (name.length <= maxLength) return name;
    const ext = name.split('.').pop();
    const nameWithoutExt = name.slice(0, name.lastIndexOf('.'));
    const truncated = nameWithoutExt.slice(0, maxLength - ext.length - 4) + '...';
    return truncated + '.' + ext;
  };

  /* ADDED: Check if authenticated
  if (!authToken) {
    return (
      <div className="file-manager">
        <div className="empty-state">
          <p>⚠️ Please login first to manage files.</p>
        </div>
      </div>
    );
  }
*/

  return (
    <div className="file-manager">
      {/* Compact Header */}
      <div className="header">
        <div className="header-row">
          <h1 className="title">File Manager</h1>
          <button
            onClick={loadFiles}
            disabled={!selectedconversation || loading}
            className={`refresh-btn ${(!selectedconversation || loading) ? 'disabled' : ''}`}
          >
            <RefreshCw className={`icon-sm ${loading ? 'spinning' : ''}`} />
            Refresh
          </button>
        </div>
        
        <select
          value={selectedconversation}
          onChange={(e) => setSelectedconversation(e.target.value)}
          className="conversation-select"
        >
          <option value="">Select a conversation...</option>
          {localConversations.map((conversation) => (
            <option key={conversation} value={conversation}>
              {conversation === 'default' ? 'Default Conversation' : conversation.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      <div className="content">
        {error && (
          <div className="error-alert">
            <AlertTriangle className="icon-sm error-icon" />
            <span className="error-text">{error}</span>
            <button onClick={() => setError('')} className="error-close">
              <X className="icon-sm" />
            </button>
          </div>
        )}

        {!selectedconversation ? (
          <div className="empty-state">
            <p>Select a conversation to view files</p>
          </div>
        ) : loading ? (
          <div className="loading-state">
            <RefreshCw className="icon-md spinning" />
            <p>Loading...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="empty-state">
            <p>No files found</p>
          </div>
        ) : (
          <div className="files-container">
            <div className="files-content">
              <div className="files-count">{files.length} files</div>
              
              <div className="files-list">
                {files.map((file) => (
                  <div key={file.id} className="file-card">
                    <div className="file-content">
                      <div className="file-header">
                        <div className="file-info">
                          <span className="file-icon">{getFileIcon(file.type)}</span>
                          <div className="file-details">
                            <div className="file-name" title={file.name}>
                              {truncateFilename(file.name)}
                            </div>
                            <div className="file-size">
                              {formatFileSize(file.size)}
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => setShowDeleteConfirm(file.id)}
                          disabled={deletingFiles.has(file.id)}
                          className={`delete-btn ${deletingFiles.has(file.id) ? 'disabled' : ''}`}
                          title="Delete file"
                        >
                          {deletingFiles.has(file.id) ? (
                            <RefreshCw className="icon-sm spinning" />
                          ) : (
                            <Trash2 className="icon-sm" />
                          )}
                        </button>
                      </div>
                      
                      <div className="file-meta">
                        <div className="meta-items">
                          <div className="meta-item">
                            {file.hasEmbeddings ? (
                              <Check className="icon-sm check-icon" />
                            ) : (
                              <X className="icon-sm x-icon" />
                            )}
                            <span>Embeddings</span>
                          </div>
                          
                          <div className="chunks-count">
                            {file.chunkCount} chunks
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compact Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <AlertTriangle className="icon-sm warning-icon" />
                <h3 className="modal-title">Delete File</h3>
              </div>
              
              <p className="modal-text">
                Delete this file and all associated embeddings and chunks? This cannot be undone.
              </p>
              
              <div className="modal-actions">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteFile(showDeleteConfirm)}
                  disabled={deletingFiles.has(showDeleteConfirm)}
                  className={`delete-confirm-btn ${deletingFiles.has(showDeleteConfirm) ? 'disabled' : ''}`}
                >
                  {deletingFiles.has(showDeleteConfirm) ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default S3FileManager;