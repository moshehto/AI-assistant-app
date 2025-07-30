const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openChatbotWindow: () => ipcRenderer.send('open-chatbot-window'),
  openTaskManagerWindow: () => ipcRenderer.send('task-manager-window'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),

  // 📨 Send new task to main process
  sendNewTask: (taskName) => ipcRenderer.send('new-task', taskName),

  // 📥 Receive new task in FloatingBar
  onNewTask: (callback) => ipcRenderer.on('new-task', callback),
  removeNewTaskListener: (callback) => ipcRenderer.removeListener('new-task', callback),

  deleteTask: (taskValue) => ipcRenderer.send('delete-task', taskValue),
  onDeleteTask: (callback) => ipcRenderer.on('delete-task', callback),
  removeDeleteTaskListener: (callback) => ipcRenderer.removeListener('delete-task', callback),

  getTaskList: () => ipcRenderer.invoke('get-task-list'),





});
