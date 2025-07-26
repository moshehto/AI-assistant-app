// src/components/UploadForm.jsx
import React from 'react';
import { useState } from 'react';
import { uploadAudio } from '../api';

export default function UploadForm() {
  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState("english");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please upload a file.");

    setLoading(true);
    try {
      const data = await uploadAudio(file, language);
      setResult(data);
    } catch (err) {
      alert("Error during upload or processing.");
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>Upload Audio for Summary</h2>
      <form onSubmit={handleSubmit}>
        <input type="file" accept="audio/*" onChange={e => setFile(e.target.files[0])} />
        <select value={language} onChange={e => setLanguage(e.target.value)}>
          <option value="english">English</option>
          <option value="arabic">Arabic</option>
        </select>
        <button type="submit" disabled={loading}>{loading ? "Processing..." : "Submit"}</button>
      </form>

      {result && (
        <div>
          <h3>Transcript:</h3>
          <pre>{result.transcript}</pre>
          <h3>Summary:</h3>
          <pre>{result.summary}</pre>
        </div>
      )}
    </div>
  );
}
