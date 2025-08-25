//Chatbot.jsx
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useApp } from '../contexts/AppContext';
import '../styling/chatbot.css';

export default function Chatbot({ conversationId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentconversation, setCurrentconversation] = useState('default');
  const [darkMode, setDarkMode] = useState(true);
  const scrollRef = useRef(null);

  // Access shared state - IMPORTANT: Get auth token from context
  const { state } = useApp();

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://chatbot-backend-fwl6.onrender.com';

  // Helper function to detect if text contains Arabic characters
  const hasArabicText = (text) => {
    // Arabic Unicode range: U+0600 to U+06FF (Arabic block)
    // Extended Arabic: U+0750 to U+077F (Arabic Supplement)
    // Arabic Presentation Forms: U+FB50 to U+FDFF and U+FE70 to U+FEFF
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return arabicRegex.test(text);
  };

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    if (!state.authToken) {
      console.warn('No auth token available');
      return { 'Content-Type': 'application/json' };
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${state.authToken}`
    };
  };

  // ✅ Load chat history with auth headers
  const loadChatHistory = async (conversation) => {
    try {
      const res = await fetch(`${API_BASE}/chat-history?conversation=${conversation}`, {
        headers: getAuthHeaders() // ADDED: Include auth headers
      });
      
      if (!res.ok) {
        console.error(`Failed to load chat history: ${res.status}`);
        return;
      }
      
      const data = await res.json();
      if (data?.history) {
        // Add unique IDs to loaded messages
        const messagesWithIds = data.history.map((msg, index) => ({
          ...msg,
          id: `loaded-${Date.now()}-${index}`
        }));
        setMessages(messagesWithIds);
      }
    } catch (err) {
      console.error("❌ Failed to load chat history:", err);
    }
  };

  // ✅ Initialize conversation and theme
  useEffect(() => {
    const init = async () => {
      let conversation = 'default';
      
      // Try to get conversation from props first (URL parameter)
      if (conversationId) {
        conversation = conversationId;
      } else {
        // Fallback to electron API if available
        const electronConversation = await window.electronAPI?.getInitialconversation?.();
        conversation = electronConversation || 'default';
      }
      
      setCurrentconversation(conversation);
      
      // Only load history if we have auth token
      if (state.authToken) {
        loadChatHistory(conversation);
      }

      // Load theme preference - use in-memory storage instead of localStorage
      const savedMode = sessionStorage.getItem('chatbot-dark-mode');
      if (savedMode !== null) setDarkMode(savedMode === 'true');
    };
    init();
  }, [conversationId, state.authToken]); // Re-run when auth token changes

  // ✅ Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    sessionStorage.setItem('chatbot-dark-mode', newMode.toString());
  };

  // ✅ Send message with auth headers
  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage = { 
      role: 'user', 
      content: trimmed,
      id: `user-${Date.now()}`
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: getAuthHeaders(), // CHANGED: Use auth headers
        body: JSON.stringify({ message: trimmed, conversation: currentconversation }),
      });

      if (!res.ok) {
        console.error(`Chat request failed: ${res.status}`);
        throw new Error(`Chat request failed: ${res.status}`);
      }

      const data = await res.json();
      const reply = data?.reply || "Sorry, I didn't understand that.";
      
      const assistantMessage = {
        role: 'assistant',
        content: reply,
        id: `assistant-${Date.now()}`
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (err) {
      console.error('Error:', err);
      const errorMessage = {
        role: 'assistant',
        content: '❌ Something went wrong. Please try again later.',
        id: `error-${Date.now()}`
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ✅ Upload handler with auth headers
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Show uploading message immediately
    const uploadingMessage = {
      role: 'assistant',
      content: `📤 Uploading ${files.length} file(s)...`,
      id: `uploading-${Date.now()}`
    };
    setMessages(prev => [...prev, uploadingMessage]);

    const uploadedFiles = [];
    const failedFiles = [];

    // Process files one by one
    for (const file of files) {
      const formData = new FormData();
      formData.append('conversation_id', currentconversation);
      formData.append('file', file);

      try {
        console.log(`📦 Uploading ${file.name} to backend...`);
        
        const res = await fetch(`${API_BASE}/upload-and-index`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${state.authToken}` // ADDED: Auth header for file upload
          },
          body: formData
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

    // Replace uploading message with result
    let resultMessage;
    if (uploadedFiles.length > 0 && failedFiles.length === 0) {
      resultMessage = {
        role: 'assistant',
        content: `✅ Successfully uploaded ${uploadedFiles.length} file(s) to conversation "${currentconversation}". You can now ask questions about your documents!`,
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
    
    setMessages(prev => prev.map(msg => 
      msg.id === uploadingMessage.id ? resultMessage : msg
    ));

    e.target.value = null;
  };

  /* Check if authenticated
  if (!state.authToken) {
    return (
      <div className={`chatbot-container ${darkMode ? 'dark' : 'light'}`}>
        <div className="chatbot-messages">
          <div className="message-row assistant">
            <div className="message-bubble">
              ⚠️ Please login first to use the chatbot.
            </div>
          </div>
        </div>
      </div>
    );
  }
*/

  return (
    <div className={`chatbot-container ${darkMode ? 'dark' : 'light'}`}>
      {/* Header */}
      <div className="chatbot-header">
        <div className="chatbot-title">
          Private.ly
          <span className="conversation-indicator">
            {currentconversation !== 'default' ? ` - ${currentconversation.replace(/_/g, ' ')}` : ''}
          </span>
        </div>
        <div className="chatbot-header-buttons">
          <button className="chatbot-toggle-mode" onClick={toggleDarkMode}>
            {darkMode ? '🌞' : '🌙'}
          </button>
          <button className="chatbot-minimize" onClick={() => window.electronAPI?.minimizeWindow?.()}>—</button>
          <button className="chatbot-close" onClick={() => window.close()}>×</button>
        </div>
      </div>

      {/* Messages */}
      <div className="chatbot-messages">
        {messages.map((msg) => {
          const isArabic = hasArabicText(msg.content);
          return (
            <div key={msg.id} className={`message-row ${msg.role}`}>
              <div className={`message-bubble ${isArabic ? 'rtl-text' : ''}`}>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="message-row assistant">
            <div className="message-bubble typing">Chatbot is thinking...</div>
          </div>
        )}
        <div ref={scrollRef}></div>
      </div>

      {/* Input */}
      <div className="chatbot-input-area">
        <label className="chatbot-upload-icon" title="Upload file">
          📎
          <input
            type="file"
            onChange={handleFileUpload}
            accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.json,.png,.jpeg,.jpg,.heic"
            multiple
            className="chatbot-file-hidden"
          />
        </label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="chatbot-input"
          disabled={loading}
        />
        <button 
          onClick={sendMessage} 
          className="chatbot-send"
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}