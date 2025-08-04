import React, { useState, useEffect } from 'react';
import '../styling/floatingbar.css';
import UploadFile from './UploadFile';

export default function FloatingBar() {
  const [conversations, setConversations] = useState([
    { label: '🗂️ Default conversation', value: 'default' },
    { label: '⚙️ Manage conversations', value: 'manage_conversations' }
  ]);

  const [selectedConversation, setSelectedConversation] = useState('default');

  const API_BASE = 'https://chatbot-backend-fwl6.onrender.com';

  // ✅ Load conversations from S3 backend on app start
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/conversations`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        const rawConversations = data.conversations || ['default'];
        
        const mapped = rawConversations.map(value => {
          const label = value === 'default'
            ? '🗂️ Default conversation'
            : `🆕 ${value.replace(/_/g, ' ')}`;
          return { label, value };
        });

        // Add Manage conversations option at end
        setConversations([...mapped, { label: '⚙️ Manage conversations', value: 'manage_conversations' }]);
        
      } catch (error) {
        console.error('❌ Failed to load conversations:', error);
        // Fallback to default
        setConversations([
          { label: '🗂️ Default conversation', value: 'default' },
          { label: '⚙️ Manage conversations', value: 'manage_conversations' }
        ]);
      }
    };

    loadConversations();
  }, []);

  // ✅ Refresh conversations when window gains focus (in case they were changed in conversation manager)
  useEffect(() => {
    const refreshConversations = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/conversations`);
        if (!response.ok) return;
        
        const data = await response.json();
        const rawConversations = data.conversations || ['default'];
        
        const mapped = rawConversations.map(value => {
          const label = value === 'default'
            ? '🗂️ Default conversation'
            : `🆕 ${value.replace(/_/g, ' ')}`;
          return { label, value };
        });

        setConversations([...mapped, { label: '⚙️ Manage conversations', value: 'manage_conversations' }]);
        
      } catch (error) {
        console.error('❌ Failed to refresh conversations:', error);
      }
    };

    // Refresh conversations when window gains focus
    const handleFocus = () => refreshConversations();
    window.addEventListener('focus', handleFocus);
    
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleConversationChange = (e) => {
    const selected = e.target.value;
    if (selected === 'manage_conversations') {
      window.electronAPI?.openconversationManagerWindow?.();
    } else {
      setSelectedConversation(selected);
    }
  };

  return (
    <div className="floating-bar">
      <select
        className="conversation-dropdown"
        value={selectedConversation}
        onChange={handleConversationChange}
        title="Choose conversation Context"
      >
        {conversations.map((conversation, index) => (
          <option key={index} value={conversation.value}>
            {conversation.label}
          </option>
        ))}
      </select>

      <button className="bar-btn" title="Start">🎙️</button>
      <button className="bar-btn" title="List Files" onClick={() => window.electronAPI?.openFileManagerWindow?.(selectedConversation)}>📁</button>
      
      {/* ✅ Now matches your theme perfectly */}
      <UploadFile 
        currentconversation={selectedConversation} 
        className="bar-btn"
        title="Upload File"
      />
      
      <button className="bar-btn" title="Chatbot" onClick={() => window.electronAPI?.openChatbotWindow?.(selectedConversation)}>🧠</button>
      <div className="drag-fill" />
      <button className="bar-btn close-btn" title="Minimize" onClick={() => window.electronAPI?.minimizeWindow?.()}>─</button>
    </div>
  );
}