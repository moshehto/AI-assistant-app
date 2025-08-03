import React, { useState, useEffect } from 'react';
import { Trash2, RefreshCw, AlertTriangle, Check, X } from 'lucide-react';
import '../styling/filemanager.css';


const S3FileManager = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState('');
  const [tasks, setTasks] = useState([]);
  const [deletingFiles, setDeletingFiles] = useState(new Set());
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // API Base URL - Render hosted backend
  const API_BASE = 'https://chatbot-backend-fwl6.onrender.com';

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    if (selectedTask) {
      loadFiles();
    }
  }, [selectedTask]);

  const loadTasks = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/tasks`);
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError('Failed to load tasks');
    }
  };

  const loadFiles = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/api/files?task=${encodeURIComponent(selectedTask)}`);
      if (!response.ok) {
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
      const response = await fetch(`${API_BASE}/api/files/${encodeURIComponent(fileId)}`, { 
        method: 'DELETE' 
      });
      
      if (!response.ok) {
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

  return (
    <div className="file-manager">
      {/* Compact Header */}
      <div className="header">
        <div className="header-row">
          <h1 className="title">File Manager</h1>
          <button
            onClick={loadFiles}
            disabled={!selectedTask || loading}
            className={`refresh-btn ${(!selectedTask || loading) ? 'disabled' : ''}`}
          >
            <RefreshCw className={`icon-sm ${loading ? 'spinning' : ''}`} />
            Refresh
          </button>
        </div>
        
        <select
          value={selectedTask}
          onChange={(e) => setSelectedTask(e.target.value)}
          className="task-select"
        >
          <option value="">Select a task...</option>
          {tasks.map((task) => (
            <option key={task} value={task}>{task}</option>
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

        {!selectedTask ? (
          <div className="empty-state">
            <p>Select a task to view files</p>
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