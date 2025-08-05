import React, { useState, useEffect } from 'react';
import { AppProvider } from './contexts/AppContext';
import FloatingBar from './components/FloatingBar';  // Your existing component
import Chatbot from './components/Chatbot';          // Your existing component
import ConversationManager from './components/ConversationManager';
import FileManagerComponent from './components/FileManager';
import './App.css';
import './styling/floatingbar.css';

function AppContent() {
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

  // Render appropriate component based on window type
  const renderComponent = () => {
    switch (windowType) {
      case 'main':
        return <FloatingBar />;  // Your existing FloatingBar component
      case 'chatbot':
        return <Chatbot conversationId={conversationId} />;  // Your existing Chatbot component
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


