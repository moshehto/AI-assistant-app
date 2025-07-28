const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createMainWindow() {
    mainWindow = new BrowserWindow({
      width: 350,
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
  

function createHelloWindow() {
  const helloWindow = new BrowserWindow({
    width: 400,
    height: 300,
    resizable: true,
    alwaysOnTop: true,
    title: 'Chatbot'
  });

  helloWindow.loadURL('http://localhost:5173/chatbot.html');
}

app.whenReady().then(createMainWindow);

ipcMain.on('open-hello-window', createHelloWindow);

ipcMain.on('minimize-window', () => {
  mainWindow?.minimize();
});
