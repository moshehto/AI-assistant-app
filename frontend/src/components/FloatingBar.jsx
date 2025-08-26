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

  // Listen for conversation changes from other windows
  useEffect(() => {
    const handleConversationChange = (conversationValue) => {
      api.setCurrentConversation(conversationValue);
    };

    if (window.electronAPI?.onConversationChanged) {
      window.electronAPI.onConversationChanged(handleConversationChange);
    }

    return () => {
      if (window.electronAPI?.removeConversationChangedListener) {
        window.electronAPI.removeConversationChangedListener(handleConversationChange);
      }
    };
  }, [api]);

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

  const handleManageConversations = () => {
    window.electronAPI?.openconversationManagerWindow?.();
  };

  const getCurrentConversationName = () => {
    const current = conversations.find(conv => conv.value === state.currentConversation);
    if (current) {
      return current.label.replace(/^[\u{1F5C2}\u{1F195}]\s*/u, '').replace('Default conversation', 'Default');
    }
    return 'Default';
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
      

      
      <div 
        className="conversation-display clickable"
        onClick={handleManageConversations}
        title="Click to manage conversations"
      >
        <span className="conversation-icon">
          {conversations.find(conv => conv.value === state.currentConversation)?.label.includes('Default') ? '🗂️' : '🆕'}
        </span>
        <span className="conversation-name">
          {getCurrentConversationName()}
        </span>
      </div>

        {/* Admin Dashboard Button - Only show for admin users */}
        {state.userData?.role === 'admin' && (
          <button 
            className="bar-btn" 
            title="Admin Dashboard"
            onClick={() => {
              if (window.electronAPI?.openAdminDashboardWindow) {
                window.electronAPI.openAdminDashboardWindow();
              }
            }}
          >
            👥
          </button>
        )}
      <button className="bar-btn" title="List Files" onClick={() => window.electronAPI?.openFileManagerWindow?.(state.currentConversation)}>📁</button>
      

      
      <button className="bar-btn" title="Chatbot" onClick={() => window.electronAPI?.openChatbotWindow?.(state.currentConversation)}>🧠</button>
      
      <div className="drag-fill" />
      
      <button className="bar-btn close-btn" title="Minimize" onClick={() => window.electronAPI?.minimizeWindow?.()}>─</button>
    </div>
  );
}