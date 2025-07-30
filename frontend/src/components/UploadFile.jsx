import React from 'react';

export default function UploadFile({ currentTask = "default" }) {
  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true; // ✅ Allow multiple file selection

    input.onchange = async (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const formData = new FormData();
      formData.append('task_id', currentTask);  // ✅ Same as backend

      for (const file of files) {
        formData.append('files', file);  // ✅ Add all files under same key
      }

      try {
        const res = await fetch('http://localhost:8000/upload', {
          method: 'POST',
          body: formData
        });

        const data = await res.json();
        alert(`✅ Uploaded ${data.filenames.length} file(s) to task "${data.task}"`);
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
