import * as vscode from 'vscode';
import { Notifications, Requests } from '../../shared/messages';
import { dataServer } from '../server/DataServer';
import { extensionMessenger } from './extensionMessenger';

export function registerMessengerHandlers(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    extensionMessenger.onRequest(Requests.getData, async () => {
      return dataServer.fetchData();
    }),
    extensionMessenger.onRequest(Requests.openElectron, async () => {
      try {
        await vscode.commands.executeCommand('my-extension.openElectronWorkbench');
        return { ok: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { ok: false, message };
      }
    }),
    extensionMessenger.onNotification(Notifications.refreshData, async () => {
      const data = await dataServer.fetchData();
      extensionMessenger.sendNotification(Notifications.dataUpdated, { type: 'broadcast' }, data);
    }),
    extensionMessenger.onNotification(Notifications.routeChanged, (payload) => {
      console.log('[Webview] Route changed:', payload.path);
    }),
    extensionMessenger.onNotification(Notifications.webviewReady, (payload) => {
      console.log('[Webview] Ready:', payload.route);
    })
  );
}
