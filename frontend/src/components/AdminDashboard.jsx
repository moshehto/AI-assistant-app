import React, { useState, useEffect } from 'react';
import { Upload, Users, FileText, Trash2, RefreshCw, X, Shield, User } from 'lucide-react';
import '../styling/admindashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [sharedFiles, setSharedFiles] = useState([]);
  const [organizationUsers, setOrganizationUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://chatbot-backend-fwl6.onrender.com';
  const categories = ['All', 'Policies', 'Templates', 'Resources', 'Training', 'Other'];

  // Get auth token from localStorage
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Authentication required. Please login again.');
      return {};
    }
    return {
      'Authorization': `Bearer ${token}`
    };
  };

  // Fetch shared files
  const fetchSharedFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/shared-files`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Failed to fetch shared files');
      
      const data = await response.json();
      setSharedFiles(data.files || []);
    } catch (err) {
      setError('Failed to load shared files');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch organization users
  const fetchOrganizationUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setOrganizationUsers(data.users || []);
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Upload shared file
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const category = document.getElementById('upload-category').value;
    
    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversation_id', category.toLowerCase());
    formData.append('is_shared', 'true');
    formData.append('category', category);

    try {
      const response = await fetch(`${API_BASE}/upload-and-index`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');
      
      await fetchSharedFiles();
      setShowUploadModal(false);
      event.target.value = '';
    } catch (err) {
      setError('Failed to upload file');
      console.error(err);
    } finally {
      setUploadingFile(false);
    }
  };

  // Delete shared file
  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    
    setDeletingFileId(fileId);
    try {
      const response = await fetch(`${API_BASE}/api/shared-files/${fileId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Delete failed');
      
      await fetchSharedFiles();
    } catch (err) {
      setError('Failed to delete file');
      console.error(err);
    } finally {
      setDeletingFileId(null);
    }
  };

  // Initial load
  useEffect(() => {
    if (activeTab === 'users') {
      fetchOrganizationUsers();
    } else {
      fetchSharedFiles();
    }
  }, [activeTab]);

  // Filter files by category
  const filteredFiles = selectedCategory === 'All' 
    ? sharedFiles 
    : sharedFiles.filter(file => file.category === selectedCategory);

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <h1 className="admin-title">Admin Dashboard</h1>
        <p className="admin-subtitle">Manage your organization's users and shared resources</p>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={18} />
          Users
        </button>
        <button 
          className={`admin-tab ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => setActiveTab('files')}
        >
          <FileText size={18} />
          Shared Files
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="admin-error-banner">
          <span>{error}</span>
          <button onClick={() => setError('')} className="admin-error-close">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="admin-content">
        {activeTab === 'users' ? (
          // Users Tab
          <div>
            <div className="admin-section-header">
              <h2 className="admin-section-title">Organization Users</h2>
              <button className="admin-invite-button" disabled>
                <User size={16} />
                Invite User (Coming Soon)
              </button>
            </div>

            {loading ? (
              <div className="admin-loading">
                <RefreshCw className="spinning" size={24} />
                <p>Loading users...</p>
              </div>
            ) : (
              <div className="admin-users-grid">
                {organizationUsers.map(user => (
                  <div key={user.id} className="admin-user-card">
                    <div className="admin-user-avatar">
                      {user.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
                    </div>
                    <div className="admin-user-info">
                      <div className="admin-user-name">
                        {user.full_name || 'Unknown User'}
                      </div>
                      <div className="admin-user-email">{user.email}</div>
                      <div className="admin-user-badge">
                        {user.role === 'admin' ? (
                          <span className="admin-badge">
                            <Shield size={12} /> Admin
                          </span>
                        ) : (
                          <span className="user-role-badge">User</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Files Tab
          <div>
            <div className="admin-section-header">
              <h2 className="admin-section-title">Shared Files</h2>
              <div className="admin-file-controls">
                <select 
                  className="admin-category-filter"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <button 
                  className="admin-upload-button"
                  onClick={() => setShowUploadModal(true)}
                >
                  <Upload size={16} />
                  Upload File
                </button>
                <button 
                  className="admin-refresh-button"
                  onClick={fetchSharedFiles}
                  disabled={loading}
                >
                  <RefreshCw size={16} className={loading ? 'spinning' : ''} />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="admin-loading">
                <RefreshCw className="spinning" size={24} />
                <p>Loading files...</p>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="admin-empty-state">
                <FileText size={48} className="admin-empty-icon" />
                <p>No shared files found</p>
                <button 
                  className="admin-upload-button-empty"
                  onClick={() => setShowUploadModal(true)}
                >
                  Upload First File
                </button>
              </div>
            ) : (
              <div className="admin-files-grid">
                {filteredFiles.map(file => (
                  <div key={file.id} className="admin-file-card">
                    <div className="admin-file-header">
                      <FileText size={20} className="admin-file-icon" />
                      <span className="admin-category-badge">{file.category}</span>
                    </div>
                    <div className="admin-file-name">{file.name}</div>
                    <div className="admin-file-metadata">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span>{formatDate(file.uploadedAt)}</span>
                    </div>
                    <button 
                      className="admin-delete-button"
                      onClick={() => handleDeleteFile(file.id)}
                      disabled={deletingFileId === file.id}
                    >
                      {deletingFileId === file.id ? (
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
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="admin-modal">
          <div className="admin-modal-content">
            <div className="admin-modal-header">
              <h3>Upload Shared File</h3>
              <button 
                className="admin-modal-close"
                onClick={() => setShowUploadModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="admin-modal-body">
              <label className="admin-form-label">Category</label>
              <select id="upload-category" className="admin-form-select">
                <option value="Policies">Policies</option>
                <option value="Templates">Templates</option>
                <option value="Resources">Resources</option>
                <option value="Training">Training</option>
                <option value="Other">Other</option>
              </select>
              
              <label className="admin-form-label">File</label>
              <input 
                type="file"
                onChange={handleFileUpload}
                className="admin-form-file"
                disabled={uploadingFile}
              />
              
              {uploadingFile && (
                <div className="admin-uploading-message">
                  <RefreshCw size={16} className="spinning" />
                  Uploading and processing embeddings...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;