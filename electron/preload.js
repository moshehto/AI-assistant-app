// If you want to expose safe APIs to renderer later
window.api = {
    sayHi: () => console.log('👋 Hi from Electron preload!'),
  };
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    openHelloWindow: () => ipcRenderer.send('open-hello-window'),
    minimizeWindow: () => ipcRenderer.send('minimize-window')
 });