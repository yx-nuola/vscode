import * as vscode from 'vscode';
import { PANEL_ID } from '../types';
import { BitmapDataService } from '../bitmap/BitmapDataService';
import { BitmapEditorPanel } from './BitmapEditorPanel';
import {
  BitmapCommands,
  type BitmapParseRequest,
  type VSCodeMessage,
} from '../../shared/bitmapProtocol';
import { getHtmlForWebview } from './webviewHtml';

export class DataPanelProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = PANEL_ID;
  private view?: vscode.WebviewView;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly dataService: BitmapDataService
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.extensionUri, 'dist-webview'),
      ],
    };

    webviewView.webview.html = getHtmlForWebview(webviewView.webview, this.extensionUri, 'activity');

    webviewView.webview.onDidReceiveMessage(async (message: VSCodeMessage) => {
      await this.handleMessage(message);
    });
  }

  private async handleMessage(message: VSCodeMessage): Promise<void> {
    try {
      switch (message.command) {
        case BitmapCommands.UPLOAD_BITMAP_FILES: {
          const files = await this.dataService.uploadFiles();
          this.post({
            command: message.command,
            requestId: message.requestId,
            payload: files,
          });
          break;
        }
        case BitmapCommands.LIST_BITMAP_FILES: {
          this.post({
            command: message.command,
            requestId: message.requestId,
            payload: this.dataService.listFiles(),
          });
          break;
        }
        case BitmapCommands.PARSE_BITMAP_DATA: {
          const payload = message.payload as BitmapParseRequest;
          const meta = await this.dataService.parse(payload.mode, payload.fileIds);
          this.post({
            command: message.command,
            requestId: message.requestId,
            payload: { meta },
          });
          BitmapEditorPanel.open(this.extensionUri, this.dataService);
          break;
        }
        case BitmapCommands.OPEN_BITMAP_EDITOR: {
          BitmapEditorPanel.open(this.extensionUri, this.dataService);
          this.post({
            command: message.command,
            requestId: message.requestId,
            payload: this.dataService.getMeta(),
          });
          break;
        }
      }
    } catch (error) {
      this.post({
        command: message.command,
        requestId: message.requestId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private post(message: VSCodeMessage): void {
    void this.view?.webview.postMessage(message);
  }
}
