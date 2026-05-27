import { HOST_EXTENSION } from 'vscode-messenger-common';
import { Messenger } from 'vscode-messenger-webview';
import type { VsCodeApi } from 'vscode-messenger-webview/lib/vscode-api';
import { Notifications, Requests } from '../../shared/messages';

declare const acquireVsCodeApi: (() => VsCodeApi) | undefined;

const hasVsCodeApi = typeof acquireVsCodeApi === 'function';
const vscodeApi = hasVsCodeApi
  ? acquireVsCodeApi()
  : createBrowserPreviewApi();

export const webviewMessenger = new Messenger(vscodeApi);

let started = false;

export function startMessenger(): void {
  if (!started) {
    webviewMessenger.start();
    started = true;
  }
}

export function notifyReady(route: string): void {
  webviewMessenger.sendNotification(Notifications.webviewReady, HOST_EXTENSION, { route });
}

export function notifyRouteChanged(path: string): void {
  webviewMessenger.sendNotification(Notifications.routeChanged, HOST_EXTENSION, { path });
}

export async function requestData() {
  if (!hasVsCodeApi) {
    return [
      { id: 'preview-1', name: 'Local preview', status: 'active', createdAt: new Date().toISOString() },
    ];
  }

  return webviewMessenger.sendRequest(Requests.getData, HOST_EXTENSION);
}

export async function requestOpenElectron() {
  if (!hasVsCodeApi) {
    return { ok: true, message: 'Electron launch is available inside the VS Code extension host.' };
  }

  return webviewMessenger.sendRequest(Requests.openElectron, HOST_EXTENSION);
}

export function requestRefreshData(): void {
  webviewMessenger.sendNotification(Notifications.refreshData, HOST_EXTENSION);
}

function createBrowserPreviewApi(): VsCodeApi {
  return {
    postMessage: (message: unknown) => {
      console.debug('[VS Code preview message]', message);
    },
    getState: () => undefined,
    setState: () => undefined,
  };
}
