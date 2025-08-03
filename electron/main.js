const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let chatbotWindow; // Track chatbot window instance
let taskList = ['default'];

const TASKS_FILE = path.join(__dirname, 'tasks.json');

// Load and save tasks (unchanged)
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

function saveTasksToDisk() {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(taskList, null, 2));
}

// Main floating bar (unchanged)
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

// Create or show chatbot window
function createOrToggleChatbotWindow(task) {
  if (chatbotWindow && !chatbotWindow.isDestroyed()) {
    if (chatbotWindow.isVisible()) {
      chatbotWindow.hide();
    } else {
      chatbotWindow.show();
      chatbotWindow.focus();
    }
  } else {
    chatbotWindow = new BrowserWindow({
      width: 400,
      height: 300,
      minWidth: 400,
      minHeight: 300,
      frame: false,
      transparent: true,
      resizable: true,
      alwaysOnTop: true,
      title: 'Chatbot',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js')
      }
    });

    chatbotWindow.loadURL('http://localhost:5173/chatbot.html');

    chatbotWindow.webContents.once('did-finish-load', () => {
      ipcMain.once('get-initial-task', (event) => {
        event.reply('set-task', task || 'default');
      });
    });

    chatbotWindow.on('closed', () => {
      chatbotWindow = null; // Clean up reference
    });
  }
}

// Task manager window (unchanged)
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

// IPC handlers (mostly unchanged)
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

ipcMain.on('open-chatbot-window', (event, task) => {
  createOrToggleChatbotWindow(task || 'default');
});

ipcMain.on('task-manager-window', createTaskManagerWindow);

ipcMain.on('minimize-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
});

// Register global shortcut on ready
app.whenReady().then(() => {
  loadTasksFromDisk();
  createMainWindow();

  globalShortcut.register('Command+Shift+H', () => {
    // Toggle chatbot window visibility on shortcut
    createOrToggleChatbotWindow();
  });
});

// Clean up global shortcuts on quit
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
