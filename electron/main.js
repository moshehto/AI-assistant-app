const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 70,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadURL('http://localhost:5173/index.html');
}

function createChatbotWindow() {
  const chatbotWindow = new BrowserWindow({
    width: 400,
    height: 300,
    alwaysOnTop: true,
    title: 'Chatbot'
  });
  chatbotWindow.loadURL('http://localhost:5173/chatbot.html');
}

function createTaskManagerWindow() {
  const taskWindow = new BrowserWindow({
    width: 400,
    height: 300,
    alwaysOnTop: true,
    title: 'Task Manager',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js') // 👈 Required for task window to send IPC
    }
  });
  taskWindow.loadURL('http://localhost:5173/taskmanager.html');
}

// ✅ IPC handlers
ipcMain.on('new-task', (event, taskName) => {
  if (mainWindow?.webContents) {
    mainWindow.webContents.send('new-task', taskName);
  }
});

ipcMain.on('delete-task', (event, taskValue) => {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('delete-task', taskValue);
    }
  });
  

ipcMain.on('open-chatbot-window', createChatbotWindow);
ipcMain.on('task-manager-window', createTaskManagerWindow);
ipcMain.on('minimize-window', () => {
  mainWindow?.minimize();
});

app.whenReady().then(createMainWindow);
