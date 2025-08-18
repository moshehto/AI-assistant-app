//UploadFile.jsx
import React from 'react';
import { useApp } from '../contexts/AppContext'; // ADDED: Import useApp to get auth token

export default function UploadFile({ 
  currentConversation = "default", 
  onUploadComplete = null,
  className = "",
  style = {},
  title = "Upload File",
  children = null,
  disabled = false,
  acceptedFiles = ".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.json,.png,.jpeg,.jpg,.heic",
  ...otherProps
}) {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://chatbot-backend-fwl6.onrender.com';
  
  // ADDED: Get auth token from context
  const { state } = useApp();
  const { authToken } = state;

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleUpload();
    }
  };

  const handleUpload = () => {
    // ADDED: Check if authenticated
    if (!authToken) {
      alert('⚠️ Please login first to upload files.');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = acceptedFiles;

    input.onchange = async (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      // Show uploading message if callback provided
      if (onUploadComplete) {
        onUploadComplete({
          role: 'assistant',
          content: `📤 Uploading ${files.length} file(s)...`,
          id: `uploading-${Date.now()}`
        });
      }

      const uploadedFiles = [];
      const failedFiles = [];

      // Process files one by one
      for (const file of files) {
        const formData = new FormData();
        formData.append('conversation_id', currentConversation);
        formData.append('file', file);

        try {
          const res = await fetch(`${API_BASE}/upload-and-index`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}` // ADDED: Include auth header
            },
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            uploadedFiles.push(data.filename || file.name);
          } else {
            if (res.status === 401) {
              throw new Error('Authentication required. Please login again.');
            }
            throw new Error(`Upload failed: ${res.status}`);
          }

        } catch (err) {
          console.error(`❌ Upload error for ${file.name}:`, err);
          failedFiles.push(file.name);
          
          // ADDED: Special handling for auth errors
          if (err.message.includes('Authentication')) {
            alert('⚠️ ' + err.message);
            break; // Stop processing more files if auth failed
          }
        }
      }

      // Show result message
      let resultMessage;
      if (uploadedFiles.length > 0 && failedFiles.length === 0) {
        resultMessage = {
          role: 'assistant',
          content: `✅ Successfully uploaded ${uploadedFiles.length} file(s) to "${currentConversation}". You can now ask questions about your documents!`,
          id: `upload-success-${Date.now()}`
        };
      } else if (uploadedFiles.length > 0 && failedFiles.length > 0) {
        resultMessage = {
          role: 'assistant',
          content: `⚠️ Uploaded ${uploadedFiles.length} file(s), but ${failedFiles.length} failed: ${failedFiles.join(', ')}`,
          id: `upload-partial-${Date.now()}`
        };
      } else {
        resultMessage = {
          role: 'assistant',
          content: '❌ All uploads failed. Please try again.',
          id: `upload-error-${Date.now()}`
        };
      }

      if (onUploadComplete) {
        onUploadComplete(resultMessage);
      } else {
        // Fallback: show alert if no callback provided
        if (uploadedFiles.length > 0) {
          alert(`✅ Uploaded ${uploadedFiles.length} file(s) to "${currentConversation}"`);
        } else {
          alert('❌ Upload failed. Please try again.');
        }
      }
    };

    input.click();
  };

  return (
    <button 
      className={className} 
      title={title}
      onClick={handleUpload}
      onKeyDown={handleKeyPress}
      style={style}
      disabled={disabled || !authToken} // ADDED: Disable if not authenticated
      {...otherProps}
    >
      {children || '📎'}
    </button>
  );
}