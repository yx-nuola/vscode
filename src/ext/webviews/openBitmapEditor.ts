import * as vscode from 'vscode';
import { Notifications, ViewIds, WebviewRoutes } from '../../shared/messages';
import { extensionMessenger } from '../messenger/extensionMessenger';
import { getWebviewHtml } from './WebviewHtml';

export function openBitmapEditorPanel(context: vscode.ExtensionContext): vscode.WebviewPanel {
  const panel = vscode.window.createWebviewPanel(
    ViewIds.bitmapEditor,
    'RRAM Bitmap',
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [
        vscode.Uri.joinPath(context.extensionUri, 'dist-webview'),
      ],
    }
  );

  panel.webview.html = getWebviewHtml({
    extensionUri: context.extensionUri,
    webview: panel.webview,
    initialRoute: WebviewRoutes.bitmap,
    title: 'RRAM Bitmap',
  });

  extensionMessenger.registerWebviewPanel(panel, {
    broadcastMethods: [Notifications.dataUpdated.method, Notifications.navigateTo.method],
  });

  return panel;
}
