import React from 'react';

export default function UploadFile({ 
  currentTask = "default", 
  userId = "user123", 
  groupId = null,
  onUploadComplete = null, // Callback to update chat messages
  className = "", // Custom CSS classes
  style = {}, // Inline styles
  title = "Upload File", // Button title/tooltip
  children = null, // Custom button content
  disabled = false, // Disable button
  acceptedFiles = ".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.json,.png,.jpeg,.jpg,.heic",
  ...otherProps // Any other button props
}) {
  const API_BASE = 'https://chatbot-backend-fwl6.onrender.com';

  const handleUpload = () => {
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

      // Process files one by one (your endpoint expects single file)
      for (const file of files) {
        const formData = new FormData();
        formData.append('user_id', userId);
        formData.append('task_id', currentTask);
        formData.append('file', file); // Fixed: was referencing undefined 'file' variable

        try {
          console.log(`📦 Uploading ${file.name} to backend...`);

          const res = await fetch(`${API_BASE}/upload-and-index`, {
            method: 'POST',
            body: formData,
          });

          const responseText = await res.text();
          console.log(`📬 Upload response for ${file.name}:`, res.status, responseText);

          if (res.ok) {
            const data = JSON.parse(responseText);
            uploadedFiles.push(data.filename || file.name);
            console.log(`✅ Successfully uploaded ${file.name}`);
          } else {
            throw new Error(`Upload failed: ${res.status} ${responseText}`);
          }

        } catch (err) {
          console.error(`❌ Upload error for ${file.name}:`, err);
          failedFiles.push(file.name);
        }
      }

      // Show result message
      let resultMessage;
      if (uploadedFiles.length > 0 && failedFiles.length === 0) {
        resultMessage = {
          role: 'assistant',
          content: `✅ Successfully uploaded ${uploadedFiles.length} file(s) to task "${currentTask}". You can now ask questions about your documents!`,
          id: `upload-success-${Date.now()}`
        };
      } else if (uploadedFiles.length > 0 && failedFiles.length > 0) {
        resultMessage = {
          role: 'assistant',
          content: `⚠️ Uploaded ${uploadedFiles.length} file(s) successfully, but ${failedFiles.length} failed: ${failedFiles.join(', ')}`,
          id: `upload-partial-${Date.now()}`
        };
      } else {
        resultMessage = {
          role: 'assistant',
          content: '❌ All uploads failed. Please check your connection and try again.',
          id: `upload-error-${Date.now()}`
        };
      }

      if (onUploadComplete) {
        onUploadComplete(resultMessage);
      } else {
        // Fallback: show alert if no callback (for floating bar usage)
        if (uploadedFiles.length > 0) {
          alert(`✅ Uploaded ${uploadedFiles.length} file(s) to task "${currentTask}"`);
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
      style={style}
      disabled={disabled}
      {...otherProps}
    >
      {children || '📎'}
    </button>
  );
}