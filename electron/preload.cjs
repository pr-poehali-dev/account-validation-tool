const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopChecker', {
  isDesktop: true,
  checkBatch: (payload) => ipcRenderer.invoke('check-batch', payload),
});
