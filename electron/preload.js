const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openChatbotWindow: (task) => ipcRenderer.send('open-chatbot-window', task),
  openTaskManagerWindow: () => ipcRenderer.send('task-manager-window'),
  openFileManagerWindow: () => ipcRenderer.send('file-manager-window'),

  minimizeWindow: () => ipcRenderer.send('minimize-window'),

  sendNewTask: (taskName) => ipcRenderer.send('new-task', taskName),

  onNewTask: (callback) => ipcRenderer.on('new-task', callback),
  removeNewTaskListener: (callback) => ipcRenderer.removeListener('new-task', callback),

  deleteTask: (taskValue) => ipcRenderer.send('delete-task', taskValue),
  onDeleteTask: (callback) => ipcRenderer.on('delete-task', callback),
  removeDeleteTaskListener: (callback) => ipcRenderer.removeListener('delete-task', callback),

  getTaskList: () => ipcRenderer.invoke('get-task-list'),
  
  notifyAuthenticated: () => ipcRenderer.send('user-authenticated'),
  notifyLoggedOut: () => ipcRenderer.send('user-logged-out'),

  getInitialTask: () => {
    ipcRenderer.send('get-initial-task');
    return new Promise(resolve => {
      ipcRenderer.once('set-task', (_, task) => resolve(task));
    });
  }
});