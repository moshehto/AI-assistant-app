import React from 'react';

export default function UploadFile({ currentTask = "default" }) {
  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('task', currentTask);

      try {
        const res = await fetch('http://localhost:8000/upload', {
          method: 'POST',
          body: formData
        });

        const data = await res.json();
        alert(data.message); // replace with toast/snackbar if you want
      } catch (err) {
        alert('❌ Upload failed');
        console.error(err);
      }
    };

    input.click();
  };

  return (
    <button className="bar-btn" title="Upload File" onClick={handleUpload}>📎</button>
  );
}
