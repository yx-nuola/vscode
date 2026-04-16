// @ts-nocheck
const { contextBridge, ipcRenderer } = require('electron');

const electronAPI = {
  sendToMain: (message) => {
    ipcRenderer.send('renderer-to-vscode', message);
  },

  onRendererMessage: (callback) => {
    ipcRenderer.on('renderer-message', (_event, message) => {
      callback(message);
    });
  },

  removeRendererListener: () => {
    ipcRenderer.removeAllListeners('renderer-message');
  },

  loadLayout: async (windowId) => {
    return ipcRenderer.invoke('load-layout', windowId);
  },

  saveLayout: (windowId, layout) => {
    ipcRenderer.send('save-layout', { windowId, layout });
  }
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
