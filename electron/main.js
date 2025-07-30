const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

let taskList = ['default'];

const TASKS_FILE = path.join(__dirname, 'tasks.json');

// 🧠 Load tasks from disk on startup
function loadTasksFromDisk() {
  if (fs.existsSync(TASKS_FILE)) {
    try {
      const data = fs.readFileSync(TASKS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        taskList = parsed;
      }
    } catch (err) {
      console.error('❌ Failed to load tasks.json:', err);
    }
  }
}

// 💾 Save tasks to disk
function saveTasksToDisk() {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(taskList, null, 2));
}

// 🪟 Main floating bar
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

// 🧠 Chatbot window
function createChatbotWindow() {
  const chatbotWindow = new BrowserWindow({
    width: 400,
    height: 300,
    alwaysOnTop: true,
    title: 'Chatbot'
  });
  chatbotWindow.loadURL('http://localhost:5173/chatbot.html');
}

// 🗂️ Task manager window
function createTaskManagerWindow() {
  const taskWindow = new BrowserWindow({
    width: 400,
    height: 300,
    alwaysOnTop: true,
    title: 'Task Manager',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });
  taskWindow.loadURL('http://localhost:5173/taskmanager.html');
}

// 🛠 IPC handlers

ipcMain.on('new-task', (event, taskName) => {
  const taskValue = taskName.toLowerCase().replace(/\s+/g, '_');
  if (!taskList.includes(taskValue)) {
    taskList.push(taskValue);
    saveTasksToDisk();
  }
  mainWindow.webContents.send('new-task', taskName);
});

ipcMain.on('delete-task', (event, taskValue) => {
  taskList = taskList.filter(t => t !== taskValue);
  saveTasksToDisk();
  mainWindow.webContents.send('delete-task', taskValue);
});

ipcMain.handle('get-task-list', () => {
  return taskList;
});

ipcMain.on('open-chatbot-window', createChatbotWindow);
ipcMain.on('task-manager-window', createTaskManagerWindow);
ipcMain.on('minimize-window', () => {
  mainWindow?.minimize();
});

// 🏁 Initialize app
app.whenReady().then(() => {
  loadTasksFromDisk();  // ✅ Load saved tasks before showing the app
  createMainWindow();
});
