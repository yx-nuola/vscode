declare module 'electron' {
  export const app: {
    isPackaged: boolean;
    whenReady: () => Promise<void>;
    quit: () => void;
    on: (event: string, callback: () => void) => void;
  };
  export const BrowserWindow: {
    prototype: BrowserWindow;
    new (options?: BrowserWindowOptions): BrowserWindow;
  };
  export const ipcMain: {
    on: (channel: string, callback: (event: IpcMainEvent, ...args: unknown[]) => void) => void;
    handle: <T = unknown>(
      channel: string,
      callback: (event: IpcMainInvokeEvent, ...args: unknown[]) => T | Promise<T>
    ) => void;
    send: (channel: string, ...args: unknown[]) => void;
  };
  export const ipcRenderer: {
    send: (channel: string, ...args: unknown[]) => void;
    on: (channel: string, callback: (event: IpcRendererEvent, ...args: unknown[]) => void) => void;
    once: (channel: string, callback: (event: IpcRendererEvent, ...args: unknown[]) => void) => void;
    removeAllListeners: (channel: string) => void;
  };
  export const contextBridge: {
    exposeInMainWorld: (apiName: string, api: unknown) => void;
  };
  export const session: {
    defaultSession: {
      webRequest: {
        onHeadersReceived: (
          callback: (
            details: { responseHeaders?: Record<string, string[]> },
            callback: (response: { responseHeaders?: Record<string, string[]> }) => void
          ) => void
        ) => { unsubscribe: () => void };
      };
    };
  };

  export interface BrowserWindow {
    id: number;
    isDestroyed: () => boolean;
    show: () => void;
    loadURL: (url: string) => Promise<void>;
    loadFile: (path: string) => Promise<void>;
    webContents: {
      send: (channel: string, ...args: unknown[]) => void;
      openDevTools: () => void;
    };
    on: (event: string, callback: (...args: unknown[]) => void) => void;
    once: (event: string, callback: (...args: unknown[]) => void) => void;
    close: () => void;
    destroy: () => void;
  }

  export interface BrowserWindowOptions {
    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
    webPreferences?: {
      nodeIntegration?: boolean;
      contextIsolation?: boolean;
      sandbox?: boolean;
      preload?: string;
      webSecurity?: boolean;
    };
    show?: boolean;
  }

  export interface IpcMainEvent {
    sender: {
      send: (channel: string, ...args: unknown[]) => void;
    };
  }

  export interface IpcMainInvokeEvent {
    sender: {
      send: (channel: string, ...args: unknown[]) => void;
    };
  }

  export interface IpcRendererEvent {
    sender: unknown;
  }
}
