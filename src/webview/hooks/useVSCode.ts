/// <reference types="vite/client" />

import { useCallback } from 'react';
import { BitmapCommands, type VSCodeMessage } from '../../shared/bitmapProtocol';
import { Commands as LegacyCommands } from '../types';

interface VSCodeApi {
  postMessage: (message: unknown) => void;
  getState: () => unknown;
  setState: (state: unknown) => void;
}

declare const acquireVsCodeApi: (() => VSCodeApi) | undefined;

let vscodeApi: VSCodeApi | null = null;
let messageHandlers: ((message: VSCodeMessage) => void)[] = [];

function getVSCodeApi(): VSCodeApi | null {
  if (!vscodeApi) {
    if (typeof acquireVsCodeApi === 'function') {
      vscodeApi = acquireVsCodeApi();
      if (typeof window !== 'undefined') {
        window.addEventListener('message', (event: MessageEvent) => {
          const message = event.data as VSCodeMessage;
          messageHandlers.forEach((handler) => handler(message));
        });
      }
    } else {
      return null;
    }
  }
  return vscodeApi;
}

export function useVSCode() {
  const vscode = getVSCodeApi();

  const send = useCallback((command: string, payload?: unknown): void => {
    if (!vscode) {
      return;
    }
    const requestId = crypto.randomUUID();
    vscode.postMessage({ command, requestId, payload });
  }, [vscode]);

  const request = useCallback(async <T>(command: string, payload?: unknown): Promise<T> => {
    if (!vscode) {
      return Promise.reject(new Error('VSCode API not available'));
    }
    return new Promise((resolve, reject) => {
      const requestId = crypto.randomUUID();

      const handler = (message: VSCodeMessage) => {
        if (message.requestId === requestId) {
          const index = messageHandlers.indexOf(handler);
          if (index > -1) {
            messageHandlers.splice(index, 1);
          }
          if (message.error) {
            reject(new Error(message.error));
          } else {
            resolve(message.payload as T);
          }
        }
      };

      messageHandlers.push(handler);
      vscode.postMessage({ command, requestId, payload });

      setTimeout(() => {
        const index = messageHandlers.indexOf(handler);
        if (index > -1) {
          messageHandlers.splice(index, 1);
        }
      }, 30000);
    });
  }, [vscode]);

  const on = useCallback((command: string, callback: (payload: unknown) => void): (() => void) => {
    const handler = (message: VSCodeMessage) => {
      if (message.command === command) {
        callback(message.payload);
      }
    };
    messageHandlers.push(handler);
    return () => {
      const index = messageHandlers.indexOf(handler);
      if (index > -1) {
        messageHandlers.splice(index, 1);
      }
    };
  }, []);

  return { send, request, on, Commands: { ...LegacyCommands, ...BitmapCommands } };
}
