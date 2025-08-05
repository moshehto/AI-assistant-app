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

  // Access shared state if needed
  const { state } = useApp();

  const API_BASE = 'https://chatbot-backend-fwl6.onrender.com';

  // ✅ Load chat history
  const loadChatHistory = async (conversation) => {
    try {
      const res = await fetch(`${API_BASE}/chat-history?conversation=${conversation}`);
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

  // ✅ Initialize conversation and theme - UPDATED for new architecture
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
      loadChatHistory(conversation);

      // Load theme preference - use in-memory storage instead of localStorage
      const savedMode = sessionStorage.getItem('chatbot-dark-mode');
      if (savedMode !== null) setDarkMode(savedMode === 'true');
    };
    init();
  }, [conversationId]); // Re-run when conversationId prop changes

  // ✅ Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    // Use sessionStorage instead of localStorage for better compatibility
    sessionStorage.setItem('chatbot-dark-mode', newMode.toString());
  };

  // ✅ Send message with proper state management
  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return; // Prevent multiple submissions

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, conversation: currentconversation }),
      });

      const data = await res.json();
      const reply = data?.reply || "Sorry, I didn't understand that.";
      
      const assistantMessage = {
        role: 'assistant',
        content: reply,
        id: `assistant-${Date.now()}`
      };

      // Add assistant response using functional update
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

  // ✅ Upload handler with proper state management and correct endpoint
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

    // Process files one by one (your endpoint expects single file)
    for (const file of files) {
      const formData = new FormData();
      formData.append('conversation_id', currentconversation);
      formData.append('file', file); // Single file as expected

      try {
        console.log(`📦 Uploading ${file.name} to backend...`);
        
        const res = await fetch(`${API_BASE}/upload-and-index`, {
          method: 'POST',
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

  return (
    <div className={`chatbot-container ${darkMode ? 'dark' : 'light'}`}>
      {/* Header */}
      <div className="chatbot-header">
        <div className="chatbot-title">
          Private.ly
          {/* Show current conversation in title */}
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
        {messages.map((msg) => (
          <div key={msg.id} className={`message-row ${msg.role}`}>
            <div className="message-bubble">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}

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
            accept = ".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.json,.png,.jpeg,.jpg,.heic" // File types
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