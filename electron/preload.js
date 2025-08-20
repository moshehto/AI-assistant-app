const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openChatbotWindow: (conversation) => ipcRenderer.send('open-chatbot-window', conversation),
  openconversationManagerWindow: () => ipcRenderer.send('conversation-manager-window'),
  openFileManagerWindow: () => ipcRenderer.send('file-manager-window'),

  minimizeWindow: () => ipcRenderer.send('minimize-window'),

  sendNewconversation: (conversationName) => ipcRenderer.send('new-conversation', conversationName),

  onNewconversation: (callback) => ipcRenderer.on('new-conversation', callback),
  removeNewconversationListener: (callback) => ipcRenderer.removeListener('new-conversation', callback),

  deleteconversation: (conversationValue) => ipcRenderer.send('delete-conversation', conversationValue),
  onDeleteconversation: (callback) => ipcRenderer.on('delete-conversation', callback),
  removeDeleteconversationListener: (callback) => ipcRenderer.removeListener('delete-conversation', callback),

  getconversationList: () => ipcRenderer.invoke('get-conversation-list'),

  openAdminDashboardWindow: () => ipcRenderer.send('admin-dashboard-window'),

  setCurrentConversation: (conversationValue) => ipcRenderer.send('set-current-conversation', conversationValue),
  closeWindow: () => ipcRenderer.send('close-window'),
  
  onConversationChanged: (callback) => ipcRenderer.on('conversation-changed', (_, conversationValue) => callback(conversationValue)),
  removeConversationChangedListener: (callback) => ipcRenderer.removeListener('conversation-changed', callback),

  getInitialconversation: () => {
    ipcRenderer.send('get-initial-conversation');
    return new Promise(resolve => {
      ipcRenderer.once('set-conversation', (_, conversation) => resolve(conversation));
    });
  },
  
  // Add this generic send method for auth-success
  send: (channel, data) => {
    if (channel === 'auth-success') {
      ipcRenderer.send(channel, data);
    }
  }
});

