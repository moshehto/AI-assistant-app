const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let chatbotWindow; // Track chatbot window instance
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

// Main floating bar (unchanged)
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 520,
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
      ipcMain.once('get-initial-conversation', (event) => {
        event.reply('set-conversation', conversation || 'default');
      });
    });

    chatbotWindow.on('closed', () => {
      chatbotWindow = null; // Clean up reference
    });
  }
}

// conversation manager window (unchanged)
function createconversationManagerWindow() {
  const conversationWindow = new BrowserWindow({
    width: 400,
    height: 300,
    alwaysOnTop: true,
    title: 'Conversation Manager',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });
  conversationWindow.loadURL('http://localhost:5173/conversationmanager.html');
}

function createFileManagerWindow() {
  const conversationWindow = new BrowserWindow({
    width: 400,
    height: 300,
    alwaysOnTop: true,
    title: 'File Manager',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });
  conversationWindow.loadURL('http://localhost:5173/filemanager.html');
}


// IPC handlers (mostly unchanged)
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

ipcMain.on('conversation-manager-window', createconversationManagerWindow);

ipcMain.on('file-manager-window', createFileManagerWindow);


ipcMain.on('minimize-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
});

// Register global shortcut on ready
app.whenReady().then(() => {
  loadconversationsFromDisk();
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
