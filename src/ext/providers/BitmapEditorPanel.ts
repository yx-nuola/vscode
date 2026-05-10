import * as vscode from 'vscode';
import { BitmapDataService } from '../bitmap/BitmapDataService';
import {
  BitmapCommands,
  type BitmapParseResponse,
  type BitmapTableRequest,
  type BitmapViewportRequest,
  type VSCodeMessage,
} from '../../shared/bitmapProtocol';
import { getHtmlForWebview } from './webviewHtml';

export class BitmapEditorPanel {
  private static currentPanel: vscode.WebviewPanel | undefined;

  static open(extensionUri: vscode.Uri, dataService: BitmapDataService): void {
    const meta = dataService.getMeta();
    if (!meta) {
      void vscode.window.showWarningMessage('请先解析 Bitmap 数据');
      return;
    }

    if (this.currentPanel) {
      this.currentPanel.reveal(vscode.ViewColumn.One);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'bitmapMatrixEditor',
      'Bitmap Matrix',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'dist-webview')],
      }
    );

    this.currentPanel = panel;
    panel.webview.html = getHtmlForWebview(panel.webview, extensionUri, 'editor', meta.datasetId);

    panel.webview.onDidReceiveMessage(async (message: VSCodeMessage) => {
      await this.handleMessage(panel, dataService, message);
    });

    panel.onDidDispose(() => {
      if (this.currentPanel === panel) {
        this.currentPanel = undefined;
      }
    });
  }

  private static async handleMessage(
    panel: vscode.WebviewPanel,
    dataService: BitmapDataService,
    message: VSCodeMessage
  ): Promise<void> {
    try {
      switch (message.command) {
        case BitmapCommands.PARSE_BITMAP_DATA: {
          const meta = dataService.getMeta();
          if (!meta) {
            throw new Error('还没有解析 Bitmap 数据');
          }
          this.post(panel, {
            command: message.command,
            requestId: message.requestId,
            payload: { meta } satisfies BitmapParseResponse,
          });
          break;
        }
        case BitmapCommands.REQUEST_BITMAP_VIEWPORT: {
          const payload = message.payload as BitmapViewportRequest;
          this.post(panel, {
            command: message.command,
            requestId: message.requestId,
            payload: dataService.getViewport(payload),
          });
          break;
        }
        case BitmapCommands.REQUEST_BITMAP_TABLE: {
          const payload = message.payload as BitmapTableRequest;
          this.post(panel, {
            command: message.command,
            requestId: message.requestId,
            payload: dataService.getTable(payload.start, payload.count),
          });
          break;
        }
      }
    } catch (error) {
      this.post(panel, {
        command: message.command,
        requestId: message.requestId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private static post(panel: vscode.WebviewPanel, message: VSCodeMessage): void {
    void panel.webview.postMessage(message);
  }
}
