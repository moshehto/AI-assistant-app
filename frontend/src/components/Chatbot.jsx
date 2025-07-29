import React, { useState, useRef, useEffect } from 'react';
import '../styling/chatbot.css';

export default function Chatbot() {
  const [messages, setMessages] = useState([{ sender: 'bot', text: "" }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

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
        body: JSON.stringify({ message: trimmed }),
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
    <div className="chatbot-container">
      <div className="chatbot-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message-row ${msg.sender}`}>
            <div className="message-bubble">{msg.text}</div>
          </div>
        ))}
        {loading && (
          <div className="message-row bot">
            <div className="message-bubble typing">MoBot is typing...</div>
          </div>
        )}
        <div ref={scrollRef}></div>
      </div>

      <div className="chatbot-input-area">
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
