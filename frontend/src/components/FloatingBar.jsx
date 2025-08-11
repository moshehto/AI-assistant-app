import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import '../styling/floatingbar.css';
import UploadFile from './UploadFile';

export default function FloatingBar() {
  const { state, api } = useApp();
  const [conversations, setConversations] = useState([
    { label: '🗂️ Default conversation', value: 'default' },
    { label: '⚙️ Manage conversations', value: 'manage_conversations' }
  ]);
  const [selectedConversation, setSelectedConversation] = useState('default');

  // Load conversations when component mounts or auth changes
  useEffect(() => {
    if (state.isAuthenticated) {
      loadConversations();
    }
  }, [state.isAuthenticated]);

  // Refresh conversations when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      if (state.isAuthenticated) {
        loadConversations();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [state.isAuthenticated]);

  const loadConversations = async () => {
    await api.fetchConversations();
    
    if (state.conversations) {
      const mapped = state.conversations.map(value => {
        const label = value === 'default'
          ? '🗂️ Default conversation'
          : `🆕 ${value.replace(/_/g, ' ')}`;
        return { label, value };
      });
      
      setConversations([...mapped, { label: '⚙️ Manage conversations', value: 'manage_conversations' }]);
    }
  };

  // Update when state conversations change
  useEffect(() => {
    if (state.conversations && state.conversations.length > 0) {
      const mapped = state.conversations.map(value => {
        const label = value === 'default'
          ? '🗂️ Default conversation'
          : `🆕 ${value.replace(/_/g, ' ')}`;
        return { label, value };
      });
      
      setConversations([...mapped, { label: '⚙️ Manage conversations', value: 'manage_conversations' }]);
    }
  }, [state.conversations]);

  const handleConversationChange = (e) => {
    const selected = e.target.value;
    if (selected === 'manage_conversations') {
      window.electronAPI?.openconversationManagerWindow?.();
    } else {
      setSelectedConversation(selected);
    }
  };

  const handleUploadComplete = (message) => {
    if (message.content.includes('✅')) {
      alert('✅ Upload completed successfully!');
    } else if (message.content.includes('⚠️')) {
      alert('⚠️ Upload partially completed - some files failed');
    } else if (message.content.includes('❌')) {
      alert('❌ Upload failed - please try again');
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
      
      <UploadFile 
        currentConversation={selectedConversation}  // FIXED: Changed from currentconversation to currentConversation
        onUploadComplete={handleUploadComplete}
        className="bar-btn"
        title="Upload File"
      />
      
      <button className="bar-btn" title="Chatbot" onClick={() => window.electronAPI?.openChatbotWindow?.(selectedConversation)}>🧠</button>
      
      <div className="drag-fill" />
      
      <button className="bar-btn close-btn" title="Minimize" onClick={() => window.electronAPI?.minimizeWindow?.()}>─</button>
    </div>
  );
}