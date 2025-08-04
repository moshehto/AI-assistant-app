const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let chatbotWindow;
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

// Main window - starts as normal window for login
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 800,
    frame: false,
    transparent: true,
    resizable: true,
    alwaysOnTop: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadURL('http://localhost:5173');

  mainWindow.on('closed', () => {
    mainWindow = null;
    app.quit();
  });
}

// Transform window to floating bar after authentication
ipcMain.on('user-authenticated', () => {
  console.log('User authenticated, transforming to floating bar...');
  
  if (mainWindow && !mainWindow.isDestroyed()) {
    // Set to floating bar dimensions
    mainWindow.setSize(490, 70);
    mainWindow.setAlwaysOnTop(true);
    mainWindow.setResizable(false);
    
    // Remove frame for floating bar look
    
    // Center the floating bar at top of screen
    const { width } = require('electron').screen.getPrimaryDisplay().workAreaSize;
  }
});

// Restore window for login after logout
ipcMain.on('user-logged-out', () => {
  console.log('User logged out, restoring login window...');
  
  if (mainWindow && !mainWindow.isDestroyed()) {
    // Restore to login window size
    mainWindow.setSize(800, 600);
    mainWindow.center();
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setResizable(true);
    mainWindow.setMenuBarVisibility(true);
    mainWindow.setAutoHideMenuBar(false);
  }
});

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

    // Load chatbot route instead of HTML file
    chatbotWindow.loadURL('http://localhost:5173/chatbot');

    chatbotWindow.webContents.once('did-finish-load', () => {
      ipcMain.once('get-initial-task', (event) => {
        event.reply('set-task', task || 'default');
      });
    });

    chatbotWindow.on('closed', () => {
      chatbotWindow = null;
    });
  }
}

// Task manager window
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
  taskWindow.loadURL('http://localhost:5173/taskmanager');
}

function createFileManagerWindow() {
  const taskWindow = new BrowserWindow({
    width: 400,
    height: 300,
    alwaysOnTop: true,
    title: 'File Manager',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });
  taskWindow.loadURL('http://localhost:5173/filemanager');
}

// IPC handlers
ipcMain.on('new-task', (event, taskName) => {
  const taskValue = taskName.toLowerCase().replace(/\s+/g, '_');
  if (!taskList.includes(taskValue)) {
    taskList.push(taskValue);
    saveTasksToDisk();
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('new-task', taskName);
  }
});

ipcMain.on('delete-task', (event, taskValue) => {
  taskList = taskList.filter(t => t !== taskValue);
  saveTasksToDisk();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('delete-task', taskValue);
  }
});

ipcMain.handle('get-task-list', () => {
  return taskList;
});

ipcMain.on('open-chatbot-window', (event, task) => {
  createOrToggleChatbotWindow(task || 'default');
});

ipcMain.on('task-manager-window', createTaskManagerWindow);

ipcMain.on('file-manager-window', createFileManagerWindow);

ipcMain.on('minimize-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
});

// Register global shortcut on ready
app.whenReady().then(() => {
  loadTasksFromDisk();
  
  // Create main window (starts as login)
  createMainWindow();

  globalShortcut.register('Command+Shift+H', () => {
    createOrToggleChatbotWindow();
  });
});

// Clean up global shortcuts on quit
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});