const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let chatbotWindow;
let conversationManagerWindow;
let fileManagerWindow;
let conversationList = ['default'];

const conversationS_FILE = path.join(__dirname, 'conversations.json');

// Load and save conversations (unchanged)
function loadconversationsFromDisk() {
  if (fs.existsSync(conversationS_FILE)) {
    try {
      const data = fs.readFileSync(conversationS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        conversationList = parsed;
      }
    } catch (err) {
      console.error('❌ Failed to load conversations.json:', err);
    }
  }
}

function saveconversationsToDisk() {
  fs.writeFileSync(conversationS_FILE, JSON.stringify(conversationList, null, 2));
}

// CREATE WINDOWS WITH DIFFERENT ROUTES - KEY CHANGE
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 900,  // Start larger for auth screen
    height: 600, // Start larger for auth screen
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Single entry point with route parameter
  mainWindow.loadURL('http://localhost:5173/?window=main');
}

// Add handler to resize window after auth success
ipcMain.on('auth-success', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    // Add a small delay to ensure the DOM has updated
    setTimeout(() => {
      mainWindow.setSize(520, 70);
      mainWindow.center();
    }, 100);
  }
});

function createOrToggleChatbotWindow(conversation) {
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
      height: 300,  // Changed from 300 to 600
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

    // Same app, different route
    chatbotWindow.loadURL(`http://localhost:5173/?window=chatbot&conversation=${conversation || 'default'}`);

    chatbotWindow.on('closed', () => {
      chatbotWindow = null;
    });
  }
}

function createConversationManagerWindow() {
  if (conversationManagerWindow && !conversationManagerWindow.isDestroyed()) {
    conversationManagerWindow.focus();
    return;
  }

  conversationManagerWindow = new BrowserWindow({
    width: 400,
    height: 300,
    alwaysOnTop: true,
    title: 'Conversation Manager',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });
  
  // Same app, different route
  conversationManagerWindow.loadURL('http://localhost:5173/?window=conversation-manager');
  
  conversationManagerWindow.on('closed', () => {
    conversationManagerWindow = null;
  });
}

function createFileManagerWindow() {
  if (fileManagerWindow && !fileManagerWindow.isDestroyed()) {
    fileManagerWindow.focus();
    return;
  }

  fileManagerWindow = new BrowserWindow({
    width: 400,
    height: 300,
    alwaysOnTop: true,
    title: 'File Manager',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });
  
  // Same app, different route
  fileManagerWindow.loadURL('http://localhost:5173/?window=file-manager');
  
  fileManagerWindow.on('closed', () => {
    fileManagerWindow = null;
  });
}

// IPC handlers (unchanged)
ipcMain.on('new-conversation', (event, conversationName) => {
  const conversationValue = conversationName.toLowerCase().replace(/\s+/g, '_');
  if (!conversationList.includes(conversationValue)) {
    conversationList.push(conversationValue);
    saveconversationsToDisk();
  }
  mainWindow.webContents.send('new-conversation', conversationName);
});

ipcMain.on('delete-conversation', (event, conversationValue) => {
  conversationList = conversationList.filter(t => t !== conversationValue);
  saveconversationsToDisk();
  mainWindow.webContents.send('delete-conversation', conversationValue);
});

ipcMain.handle('get-conversation-list', () => {
  return conversationList;
});

ipcMain.on('open-chatbot-window', (event, conversation) => {
  createOrToggleChatbotWindow(conversation || 'default');
});

ipcMain.on('conversation-manager-window', createConversationManagerWindow);
ipcMain.on('file-manager-window', createFileManagerWindow);

ipcMain.on('minimize-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
});

app.whenReady().then(() => {
  loadconversationsFromDisk();
  createMainWindow();

  globalShortcut.register('Command+Shift+H', () => {
    createOrToggleChatbotWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});