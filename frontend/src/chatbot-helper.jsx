import React from 'react';
import { createRoot } from 'react-dom/client';
import Chatbot from './components/Chatbot';

createRoot(document.getElementById('chatbot-root')).render(
  <React.StrictMode>
    <Chatbot />
  </React.StrictMode>
);
