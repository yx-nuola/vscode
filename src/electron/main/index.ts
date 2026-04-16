// @ts-nocheck
const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');

process.on('uncaughtException', (error) => {
  console.error('[Electron Main] Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Electron Main] Unhandled Rejection:', reason);
});

class ElectronMain {
  constructor() {
    this.windows = new Map();
    this.store = new Map();
    this.vscodeExtProcess = null;
    this.mainWindow = null;
    this.setupCSP();
    this.setupIPC();
  }

  setupCSP() {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: blob:; " +
            "connect-src 'self' ws://localhost:*; " +
            "worker-src 'self' blob:;"
          ]
        }
      });
    });
  }

  setupIPC() {
    ipcMain.on('vscode-to-renderer', (_event, message) => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('renderer-message', message);
      }
    });

    ipcMain.on('renderer-to-vscode', (_event, message) => {
      if (this.vscodeExtProcess && this.vscodeExtProcess.connected) {
        this.vscodeExtProcess.send(message);
      }
    });

    ipcMain.handle('load-layout', async (_event, windowId) => {
      const store = this.store.get(windowId);
      return store?.layout || null;
    });

    ipcMain.on('save-layout', (_event, { windowId, layout }) => {
      if (!this.store.has(windowId)) {
        this.store.set(windowId, {});
      }
      this.store.get(windowId).layout = layout;
    });
  }

  createWindow() {
    const preloadPath = path.join(__dirname, 'preload.js');
    
    process.on('message', (message) => {
      console.log('[Electron Main] Received from VSCode:', message);
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        const msg = message as { type?: string; cardId?: string; chunk?: ArrayBuffer; meta?: { index?: number; total?: number }; isLast?: boolean };
        
        if (msg.type === 'DATA_CHUNK') {
          this.mainWindow.webContents.send('renderer-message', {
            type: 'DATA_CHUNK',
            cardId: msg.cardId,
            chunk: msg.chunk,
            meta: msg.meta,
            isLast: msg.isLast
          });
        } else if (msg.type === 'DATA_ERROR') {
          this.mainWindow.webContents.send('renderer-message', {
            type: 'DATA_ERROR',
            cardId: msg.cardId,
            error: (msg as { error?: string }).error
          });
        }
      }
    });

    const window = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        preload: preloadPath,
        webSecurity: true
      },
      show: false
    });

    window.once('ready-to-show', () => {
      window.show();
      if (this.vscodeExtProcess && this.vscodeExtProcess.connected) {
        this.vscodeExtProcess.send({ type: 'WINDOW_READY_ACK' });
      }
    });

    window.on('closed', () => {
      this.windows.delete(window.id);
      this.store.delete(window.id);
      if (this.mainWindow === window) {
        this.mainWindow = null;
      }
    });

    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
    if (isDev) {
      window.loadURL('http://localhost:5173');
      window.webContents.openDevTools();
    } else {
      window.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    this.windows.set(window.id, window);
    this.mainWindow = window;
    return window;
  }

  setVSCodeProcess(process) {
    this.vscodeExtProcess = process;

    process.on('message', (message) => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        const msg = message as { type?: string; cardId?: string; chunk?: ArrayBuffer; meta?: { index?: number; total?: number }; isLast?: boolean };
        
        if (msg.type === 'LOAD_DATA' || msg.type === 'CANCEL_LOAD') {
          this.mainWindow.webContents.send('renderer-message', {
            type: msg.type === 'LOAD_DATA' ? 'REQUEST_LOAD' : 'CANCEL_LOAD',
            cardIds: (msg as { cardIds?: string[] }).cardIds
          });
        } else if (msg.type === 'DATA_CHUNK') {
          this.mainWindow.webContents.send('renderer-message', {
            type: 'DATA_CHUNK',
            cardId: msg.cardId,
            chunk: msg.chunk,
            meta: msg.meta,
            isLast: msg.isLast
          });
        } else if (msg.type === 'DATA_ERROR') {
          this.mainWindow.webContents.send('renderer-message', {
            type: 'DATA_ERROR',
            cardId: msg.cardId,
            error: (msg as { error?: string }).error
          });
        }
      }
    });

    process.on('disconnect', () => {
      console.log('[Electron Main] VSCode process disconnected');
      this.vscodeExtProcess = null;
    });
  }

  start() {
    app.whenReady().then(() => {
      this.createWindow();
    });

    app.on('window-all-closed', () => {
      app.quit();
    });

    app.on('activate', () => {
      if (this.windows.size === 0) {
        this.createWindow();
      }
    });
  }
}

const main = new ElectronMain();
main.start();

module.exports = { ElectronMain };
