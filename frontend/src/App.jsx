import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import AuthScreen from './components/AuthScreen';
import FloatingBar from './components/FloatingBar';
import Chatbot from './components/Chatbot';
import ConversationManager from './components/ConversationManager';
import FileManagerComponent from './components/FileManager';
import './App.css';
import './styling/floatingbar.css';

function AppContent() {
  const { state, api } = useApp();
  const [windowType, setWindowType] = useState('main');
  const [conversationId, setConversationId] = useState('default');

  useEffect(() => {
    // Parse URL parameters to determine which component to render
    const urlParams = new URLSearchParams(window.location.search);
    const window_type = urlParams.get('window') || 'main';
    const conversation = urlParams.get('conversation') || 'default';
    
    setWindowType(window_type);
    setConversationId(conversation);

    // Set window title based on type
    const titles = {
      'main': 'Main Window',
      'chatbot': 'Chatbot',
      'conversation-manager': 'Conversation Manager',
      'file-manager': 'File Manager'
    };
    document.title = titles[window_type] || 'App';
  }, []);

  // Only show auth screen for main window
  if (!state.isAuthenticated && windowType === 'main') {
    return <AuthScreen />;
  }

  // Render appropriate component based on window type
  const renderComponent = () => {
    switch (windowType) {
      case 'main':
        return <FloatingBar />;
      case 'chatbot':
        return <Chatbot conversationId={conversationId} />;
      case 'conversation-manager':
        return <ConversationManager />;
      case 'file-manager':
        return <FileManagerComponent />;
      default:
        return <FloatingBar />;
    }
  };

  return (
    <div className={`app app--${windowType}`}>
      {renderComponent()}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;