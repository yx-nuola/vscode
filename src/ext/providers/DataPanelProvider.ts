import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { PANEL_ID, Commands, VSCodeMessage } from '../types';
import { DataServer } from '../server/DataServer';

export class DataPanelProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = PANEL_ID;
  private _view?: vscode.WebviewView;
  private _extensionUri: vscode.Uri;
  private _dataServer: DataServer;

  constructor(extensionUri: vscode.Uri, dataServer?: DataServer) {
    this._extensionUri = extensionUri;
    this._dataServer = dataServer || new DataServer();
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(this._extensionUri.fsPath, 'dist-webview')),
      ],
    };

    webviewView.webview.html = this._getHtmlForWebview();

    webviewView.webview.onDidReceiveMessage(async (message: VSCodeMessage) => {
      await this._handleMessage(message);
    });
  }

  private async _handleMessage(message: VSCodeMessage): Promise<void> {
    switch (message.command) {
      case Commands.REQUEST_DATA: {
        const data = await this._dataServer.fetchData();
        this._postMessage({
          command: Commands.RESPONSE_DATA,
          requestId: message.requestId,
          payload: data,
        });
        break;
      }
      case Commands.REFRESH_DATA: {
        const data = await this._dataServer.fetchData();
        this._postMessage({
          command: Commands.LOAD_DATA,
          payload: data,
        });
        break;
      }
    }
  }

  private _postMessage(message: VSCodeMessage): void {
    this._view?.webview.postMessage(message);
  }

  private _getHtmlForWebview(): string {
    const distPath = path.join(this._extensionUri.fsPath, 'dist-webview', 'index.html');

    if (fs.existsSync(distPath)) {
      let html = fs.readFileSync(distPath, 'utf-8');

      html = html.replace(
        /(<script[^>]*src=")([^"]+)(">)/g,
        (_match, prefix, src, suffix) => {
          if (src.startsWith('http://') || src.startsWith('https://')) {
            return `${prefix}${src}${suffix}`;
          }
          const uri = vscode.Uri.file(path.join(this._extensionUri.fsPath, 'dist-webview', src));
          return `${prefix}${uri.with({ scheme: 'vscode-resource' }).toString()}${suffix}`;
        }
      );

      html = html.replace(
        /(<link[^>]*href=")([^"]+)(">)/g,
        (_match, prefix, href, suffix) => {
          if (href.startsWith('http://') || href.startsWith('https://')) {
            return `${prefix}${href}${suffix}`;
          }
          const uri = vscode.Uri.file(path.join(this._extensionUri.fsPath, 'dist-webview', href));
          return `${prefix}${uri.with({ scheme: 'vscode-resource' }).toString()}${suffix}`;
        }
      );

      return html;
    }

    return `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Data Panel</title>
        </head>
        <body>
          <div id="root">Loading...</div>
          <script>
            document.getElementById('root').innerHTML = '<p>请先运行 npm run build:webview 构建 Webview</p>';
          </script>
        </body>
      </html>`;
  }

  public async refresh(): Promise<void> {
    const data = await this._dataServer.fetchData();
    this._postMessage({
      command: Commands.LOAD_DATA,
      payload: data,
    });
  }
}
