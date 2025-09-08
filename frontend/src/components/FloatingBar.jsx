import React from 'react';
import { useApp } from '../contexts/AppContext';
import '../styling/floatingbar.css';

export default function FloatingBar() {
  const { state } = useApp();

  return (
    <div className="floating-bar">
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