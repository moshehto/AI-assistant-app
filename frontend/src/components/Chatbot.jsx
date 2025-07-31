import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import '../styling/chatbot.css';

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const [currentTask, setCurrentTask] = useState('default');
  const [darkMode, setDarkMode] = useState(true); // 🌙 Track dark mode state

  // Load chat history for task
  const loadChatHistory = async (task) => {
    try {
      const res = await fetch(`http://localhost:8000/chat-history?task=${task}`);
      const data = await res.json();
      const formatted = data.history.map((msg) => ({
        sender: msg.role === 'user' ? 'user' : 'bot',
        text: msg.content
      }));
      setMessages(formatted);
    } catch (err) {
      console.error("❌ Failed to load chat history:", err);
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
  
    const formData = new FormData();
    formData.append('task_id', currentTask);
  
    for (const file of files) {
      formData.append('files', file);
    }
  
    try {
      const res = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
  
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: `✅ Uploaded ${data.filenames.length} file(s) to task "${data.task}". You can now ask about them.`
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: '❌ Upload failed. Please try again.' }
      ]);
      console.error(err);
    }
    e.target.value = null;
    };
 
  

  // Load initial task and dark mode from localStorage
  useEffect(() => {
    const init = async () => {
      const task = await window.electronAPI?.getInitialTask?.();
      setCurrentTask(task || 'default');
      loadChatHistory(task || 'default');

      const savedMode = localStorage.getItem('chatbot-dark-mode');
      if (savedMode !== null) {
        setDarkMode(savedMode === 'true');
      }
    };
    init();
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('chatbot-dark-mode', newMode.toString());
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const newMessages = [...messages, { sender: 'user', text: trimmed }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, task: currentTask }),
      });

      const data = await res.json();
      const reply = data?.reply || "Sorry, I didn't understand that.";
      setMessages([...newMessages, { sender: 'bot', text: reply }]);
    } catch (err) {
      console.error('Error:', err);
      setMessages([
        ...newMessages,
        { sender: 'bot', text: 'Something went wrong. Please try again later.' },
      ]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={`chatbot-container ${darkMode ? 'dark' : 'light'}`}>
      {/* Draggable header */}
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
        {messages.map((msg, i) => (
            (msg.sender === 'user' || msg.sender === 'bot') && (
                <div key={i} className={`message-row ${msg.sender}`}>
                <div className="message-bubble">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
                </div>
            )
            ))}

        {loading && (
          <div className="message-row bot">
            <div className="message-bubble typing">Chatbot is thinking...</div>
          </div>
        )}
        <div ref={scrollRef}></div>
      </div>

      {/* Input area */}
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
        />
  <button onClick={sendMessage} className="chatbot-send">Send</button>
</div>

    </div>
  );
}
