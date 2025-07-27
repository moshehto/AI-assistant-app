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
  
    mainWindow.loadURL('http://localhost:5173');
  }
  

function createHelloWindow() {
  const helloWindow = new BrowserWindow({
    width: 400,
    height: 300,
    title: 'Hello World'
  });

  helloWindow.loadURL('data:text/html,<h1>Hello World</h1>');
}

app.whenReady().then(createMainWindow);

ipcMain.on('open-hello-window', createHelloWindow);

ipcMain.on('minimize-window', () => {
  mainWindow?.minimize();
});
