import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import '../styling/chatbot.css';

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTask, setCurrentTask] = useState('default');
  const [darkMode, setDarkMode] = useState(true);
  const scrollRef = useRef(null);

  const API_BASE = 'https://chatbot-backend-fwl6.onrender.com';

  // ✅ Load chat history
  const loadChatHistory = async (task) => {
    try {
      const res = await fetch(`${API_BASE}/chat-history?task=${task}`);
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

  // ✅ Initialize task and theme
  useEffect(() => {
    const init = async () => {
      const task = await window.electronAPI?.getInitialTask?.();
      const safeTask = task || 'default';
      setCurrentTask(safeTask);
      loadChatHistory(safeTask);

      const savedMode = localStorage.getItem('chatbot-dark-mode');
      if (savedMode !== null) setDarkMode(savedMode === 'true');
    };
    init();
  }, []);

  // ✅ Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('chatbot-dark-mode', newMode.toString());
  };

  // ✅ FIXED: Send message with proper state management
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
        body: JSON.stringify({ message: trimmed, task: currentTask }),
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

  // ✅ FIXED: Upload handler with proper state management
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    formData.append('task_id', currentTask);
    for (const file of files) formData.append('files', file);

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      const uploadMessage = {
        role: 'assistant',
        content: `✅ Uploaded ${data.filenames.length} file(s) to task "${data.task}". You can now ask about them.`,
        id: `upload-${Date.now()}`
      };
      
      setMessages(prev => [...prev, uploadMessage]);

    } catch (err) {
      const errorMessage = {
        role: 'assistant',
        content: '❌ Upload failed. Please try again.',
        id: `upload-error-${Date.now()}`
      };
      setMessages(prev => [...prev, errorMessage]);
      console.error(err);
    }

    e.target.value = null;
  };

  return (
    <div className={`chatbot-container ${darkMode ? 'dark' : 'light'}`}>
      {/* Header */}
      <div className="chatbot-header">
        <div className="chatbot-title">Private.ly</div>
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