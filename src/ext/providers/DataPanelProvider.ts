import * as vscode from 'vscode';
import { Notifications, ViewIds, WebviewRoutes } from '../../shared/messages';
import { extensionMessenger } from '../messenger/extensionMessenger';
import { DataServer } from '../server/DataServer';
import { getWebviewHtml } from '../webviews/WebviewHtml';

export class DataPanelProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = ViewIds.dataPanel;
  private readonly extensionUri: vscode.Uri;
  private readonly dataServer: DataServer;

  constructor(extensionUri: vscode.Uri, dataServer?: DataServer) {
    this.extensionUri = extensionUri;
    this.dataServer = dataServer ?? new DataServer();
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.extensionUri, 'dist-webview'),
      ],
    };

    webviewView.webview.html = getWebviewHtml({
      extensionUri: this.extensionUri,
      webview: webviewView.webview,
      initialRoute: WebviewRoutes.home,
      title: 'Data Panel',
    });

    extensionMessenger.registerWebviewView(webviewView, {
      broadcastMethods: [Notifications.dataUpdated.method, Notifications.navigateTo.method],
    });
  }

  public async refresh(): Promise<void> {
    const data = await this.dataServer.fetchData();
    extensionMessenger.sendNotification(
      Notifications.dataUpdated,
      { type: 'webview', webviewType: DataPanelProvider.viewType },
      data
    );
  }
}
