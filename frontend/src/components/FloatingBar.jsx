import React, { useState, useEffect } from 'react';
import '../styling/floatingbar.css';
import UploadFile from './UploadFile';

export default function FloatingBar() {
  const [conversations, setconversations] = useState([
    { label: '🗂️ Default conversation', value: 'default' },
    { label: '⚙️ Manage conversations', value: 'manage_conversations' }
  ]);

  const [selectedconversation, setSelectedconversation] = useState('default');

  // ✅ Load conversations from disk on app start
  useEffect(() => {
    const loadconversations = async () => {
      const rawconversations = await window.electronAPI?.getconversationList?.();
      const mapped = rawconversations.map(value => {
        const label = value === 'default'
          ? '🗂️ Default conversation'
          : `🆕 ${value.replace(/_/g, ' ')}`;
        return { label, value };
      });

      // Add Manage conversations option at end
      setconversations([...mapped, { label: '⚙️ Manage conversations', value: 'manage_conversations' }]);
    };

    loadconversations();
  }, []);

  

  // ✅ Handle adding conversations from conversationManager
  useEffect(() => {
    const handleNewconversation = (_, conversationName) => {
      const value = conversationName.toLowerCase().replace(/\s+/g, '_');
      const newconversation = {
        label: `🆕 ${conversationName}`,
        value
      };

      setconversations(prev => {
        const exists = prev.some(conversation => conversation.value === value);
        if (exists) return prev;

        const withoutManage = prev.filter(t => t.value !== 'manage_conversations');
        return [...withoutManage, newconversation, { label: '⚙️ Manage conversations', value: 'manage_conversations' }];
      });

      setSelectedconversation(value);
    };

    window.electronAPI?.onNewconversation?.(handleNewconversation);
    return () => window.electronAPI?.removeNewconversationListener?.(handleNewconversation);
  }, []);

  // ✅ Handle deleting conversations from conversationManager
  useEffect(() => {
    const handleDeleteconversation = (_, valueToDelete) => {
      if (valueToDelete === 'default') return;

      setconversations(prev => {
        const filtered = prev.filter(t => t.value !== valueToDelete && t.value !== 'manage_conversations');
        return [...filtered, { label: '⚙️ Manage conversations', value: 'manage_conversations' }];
      });

      if (selectedconversation === valueToDelete) {
        setSelectedconversation('default');
      }
    };

    window.electronAPI?.onDeleteconversation?.(handleDeleteconversation);
    return () => window.electronAPI?.removeDeleteconversationListener?.(handleDeleteconversation);
  }, [selectedconversation]);

  const handleconversationChange = (e) => {
    const selected = e.target.value;
    if (selected === 'manage_conversations') {
      window.electronAPI?.openconversationManagerWindow?.();
    } else {
      setSelectedconversation(selected);
    }
  };

  return (
    <div className="floating-bar">
      <select
        className="conversation-dropdown"
        value={selectedconversation}
        onChange={handleconversationChange}
        title="Choose conversation Context"
      >
        {conversations.map((conversation, index) => (
          <option key={index} value={conversation.value}>
            {conversation.label}
          </option>
        ))}
      </select>

      <button className="bar-btn" title="Start">🎙️</button>
      <button className="bar-btn" title="List Files" onClick={() => window.electronAPI?.openFileManagerWindow?.(selectedconversation)}>📁</button>
      
      {/* ✅ Now matches your theme perfectly */}
      <UploadFile 
        currentconversation={selectedconversation} 
        className="bar-btn"
        title="Upload File"
      />
      
      <button className="bar-btn" title="Chatbot" onClick={() => window.electronAPI?.openChatbotWindow?.(selectedconversation)}>🧠</button>
      <div className="drag-fill" />
      <button className="bar-btn close-btn" title="Minimize" onClick={() => window.electronAPI?.minimizeWindow?.()}>─</button>
    </div>
  );
}
