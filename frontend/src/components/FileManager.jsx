//FileManager.jsx
import React, { useState, useEffect } from 'react';
import { Trash2, RefreshCw, Check, X, FileText, File, Image, FileSpreadsheet, FileCode } from 'lucide-react';
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

  // Access shared state and API
  const { state, api } = useApp();
  const { conversations } = state;

  useEffect(() => {
    // Fetch conversations on mount using shared API
    const loadConversations = async () => {
      if (state.authToken) {
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
  }, [state.authToken]);

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
    if (selectedconversation && state.authToken) {
      loadFiles();
    }
  }, [selectedconversation, state.authToken]);

  const loadFiles = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.fetchFiles(selectedconversation);
      
      if (result.success) {
        setFiles(result.files || []);
      } else {
        setError(result.error || 'Failed to load files');
      }
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
      const result = await api.deleteFile(fileId);
      
      if (result.success) {
        setFiles(prev => prev.filter(file => file.id !== fileId));
        setShowDeleteConfirm(null);
      } else {
        setError(result.error || 'Failed to delete file');
      }
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
    if (type.includes('pdf')) return <FileText className="file-type-icon" />;
    if (type.includes('powerpoint') || type.includes('presentation')) return <FileText className="file-type-icon" />;
    if (type.includes('excel') || type.includes('spreadsheet')) return <FileSpreadsheet className="file-type-icon" />;
    if (type.includes('word') || type.includes('document')) return <FileText className="file-type-icon" />;
    if (type.includes('image')) return <Image className="file-type-icon" />;
    if (type.includes('code') || type.includes('javascript') || type.includes('python') || type.includes('json')) return <FileCode className="file-type-icon" />;
    return <File className="file-type-icon" />;
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
    <div className="private-file-manager">
      {/* Header */}
      <div className="private-header">
        <h1 className="private-title">Private.ly File Manager</h1>
        <p className="private-subtitle">Manage your document files and embeddings</p>
      </div>

      {/* Controls */}
      <div className="private-content">
        <div className="private-section-header">
          <h2 className="private-section-title">Files</h2>
          <div className="private-file-controls">
            <select
              value={selectedconversation}
              onChange={(e) => setSelectedconversation(e.target.value)}
              className="private-conversation-filter"
            >
              <option value="">Select a conversation...</option>
              {localConversations.map((conversation) => (
                <option key={conversation} value={conversation}>
                  {conversation === 'default' ? 'Default Conversation' : conversation.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            <button
              onClick={loadFiles}
              disabled={!selectedconversation || loading}
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
            <button onClick={() => setError('')} className="private-error-close">
              <X size={16} />
            </button>
          </div>
        )}

        {!selectedconversation ? (
          <div className="private-empty-state">
            <FileText size={48} className="private-empty-icon" />
            <p>Select a conversation to view files</p>
          </div>
        ) : loading ? (
          <div className="private-loading">
            <RefreshCw className="spinning" size={24} />
            <p>Loading files...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="private-empty-state">
            <FileText size={48} className="private-empty-icon" />
            <p>No files found in this conversation</p>
          </div>
        ) : (
          <div className="private-files-grid">
            {files.map((file) => (
              <div key={file.id} className="private-file-card">
                <div className="private-file-header">
                  {getFileIcon(file.type)}
                  <div className="private-file-status">
                    {file.hasEmbeddings ? (
                      <span className="private-embeddings-badge">
                        <Check size={12} /> Indexed
                      </span>
                    ) : (
                      <span className="private-embeddings-badge no-embeddings">
                        <X size={12} /> Not Indexed
                      </span>
                    )}
                  </div>
                </div>
                <div className="private-file-name" title={file.name}>
                  {file.name}
                </div>
                <div className="private-file-metadata">
                  <span>{formatFileSize(file.size)}</span>
                  <span>•</span>
                  <span>{file.chunkCount} chunks</span>
                </div>
                <button
                  className="private-delete-button"
                  onClick={() => setShowDeleteConfirm(file.id)}
                  disabled={deletingFiles.has(file.id)}
                >
                  {deletingFiles.has(file.id) ? (
                    <RefreshCw size={14} className="spinning" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="private-modal">
          <div className="private-modal-content">
            <div className="private-modal-header">
              <h3>Delete File</h3>
              <button 
                className="private-modal-close"
                onClick={() => setShowDeleteConfirm(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="private-modal-body">
              <p>Delete this file and all associated embeddings and chunks? This cannot be undone.</p>
              
              <div className="private-modal-actions">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="private-cancel-button"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteFile(showDeleteConfirm)}
                  disabled={deletingFiles.has(showDeleteConfirm)}
                  className="private-delete-confirm-button"
                >
                  {deletingFiles.has(showDeleteConfirm) ? (
                    <>
                      <RefreshCw size={14} className="spinning" />
                      Deleting...
                    </>
                  ) : (
                    'Delete File'
                  )}
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