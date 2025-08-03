import React from 'react';

export default function UploadFile({ currentTask = "default", userId = "user123", groupId = null }) {
  const API_BASE = 'https://chatbot-backend-fwl6.onrender.com';

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;

    input.onchange = async (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const uploaded = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append("user_id", userId);
        formData.append("task_id", currentTask);
        formData.append("file", file);
        if (groupId) formData.append("group_id", groupId);

        try {
          console.log("📦 Uploading file to backend:", file.name);

          const res = await fetch(`${API_BASE}/upload-and-index`, {
            method: 'POST',
            body: formData,
          });

          const responseText = await res.text();
          console.log("📬 Upload response:", res.status, responseText);

          if (res.ok) {
            uploaded.push(file.name);
            console.log(`✅ Successfully uploaded & indexed ${file.name}`);
          } else {
            console.error(`❌ Backend rejected ${file.name}`, res.status, responseText);
          }
        } catch (err) {
          console.error(`❌ Upload error for ${file.name}:`, err);
        }
      }

      alert(`✅ Uploaded ${uploaded.length} file(s) to task "${currentTask}"`);
    };

    input.click();
  };

  return (
    <button className="bar-btn" title="Upload File" onClick={handleUpload}>📎</button>
  );
}
