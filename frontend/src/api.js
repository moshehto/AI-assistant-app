// src/api.js
import axios from 'axios';

export const uploadAudio = async (file, summaryLanguage) => {
  const formData = new FormData();
  formData.append('audio', file);
  formData.append('summary_language', summaryLanguage);

  const response = await axios.post('http://localhost:8000/transcribe-and-summarize', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
};
