import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { iceService } from './iceService';
import { dataProcessor, CardData, DataChunk } from './dataProcessor';

interface ElectronProcess {
  process: ChildProcess;
  windowId: number;
}

interface BackpressureMessage {
  type: 'CHUNK_PROCESSED' | 'REQUEST_MORE';
  cardId?: string;
  chunkIndex?: number;
}

class ElectronLauncher {
  private currentProcess: ElectronProcess | null = null;
  private windowId: number = 1;
  private statusBarItem: vscode.StatusBarItem;
  private isReady: boolean = false;
  private pendingCardIds: string[] = [];
  private processingCards: Set<string> = new Set();

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    this.statusBarItem.text = '$(debug) Electron 工作台';
    this.statusBarItem.tooltip = '点击启动图形化工作台';
    this.statusBarItem.command = 'my-extension.openElectronWorkbench';
    this.statusBarItem.show();

    dataProcessor.setOnChunkCallback((chunk) => {
      this.sendChunk(chunk);
    });
  }

  public async launch(): Promise<void> {
    if (this.currentProcess?.process.connected) {
      vscode.window.showInformationMessage('Electron 工作台已在运行中');
      return;
    }

    try {
      this.updateStatus('正在启动 Electron 工作台...');
      this.isReady = false;

      const electronPath = this.findElectronPath();
      if (!electronPath) {
        throw new Error('未找到 Electron 可执行文件');
      }

      const mainPath = this.getMainProcessPath();
      if (!mainPath || !fs.existsSync(mainPath)) {
        throw new Error('未找到 Electron 主进程入口文件');
      }

      const childProcess = spawn(electronPath, [mainPath], {
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
        env: {
          ...process.env,
          NODE_ENV: 'development'
        }
      });

      this.currentProcess = {
        process: childProcess,
        windowId: this.windowId++
      };

      childProcess.on('message', (message) => {
        this.handleProcessMessage(message);
      });

      childProcess.on('error', (error) => {
        console.error('[ElectronLauncher] Process error:', error);
        this.updateStatus('Electron 工作台启动失败');
        vscode.window.showErrorMessage(`Electron 启动失败: ${error.message}`);
        this.currentProcess = null;
      });

      childProcess.on('disconnect', () => {
        console.log('[ElectronLauncher] Process disconnected');
        this.currentProcess = null;
        this.isReady = false;
        this.updateStatus('Electron 工作台已关闭');
      });

      childProcess.stderr?.on('data', (data) => {
        console.error('[ElectronLauncher] stderr:', data.toString());
      });

      this.updateStatus('Electron 工作台已启动');
      vscode.window.showInformationMessage('Electron 工作台已启动');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[ElectronLauncher] Launch error:', error);
      this.updateStatus('Electron 工作台启动失败');
      vscode.window.showErrorMessage(`启动失败: ${errorMessage}`);
    }
  }

  private handleProcessMessage(message: unknown): void {
    console.log('[ElectronLauncher] Received message:', message);

    const msg = message as { type?: string; cardId?: string; chunkIndex?: number };
    
    if (msg.type === 'WINDOW_READY_ACK') {
      this.isReady = true;
      this.updateStatus('Electron 工作台已就绪');
      this.loadAllCardData();
    } else if (msg.type === 'CHUNK_PROCESSED' && msg.cardId) {
      this.onChunkProcessed(msg.cardId, msg.chunkIndex || 0);
    } else if (msg.type === 'REQUEST_MORE' && msg.cardId) {
      this.processNextChunk(msg.cardId);
    }
  }

  private async loadAllCardData(): Promise<void> {
    const defaultCards = [
      { id: 'card-1', type: 'echarts' as const },
      { id: 'card-2', type: 'logicflow' as const },
      { id: 'card-3', type: 'canvas' as const },
      { id: 'card-4', type: 'echarts' as const }
    ];

    this.updateStatus('正在加载卡片数据...');

    for (const card of defaultCards) {
      await this.loadCardData(card.id);
    }

    this.updateStatus('Electron 工作台已就绪');
  }

  public async loadCardData(cardId: string): Promise<void> {
    if (this.processingCards.has(cardId)) {
      return;
    }

    this.processingCards.add(cardId);

    try {
      this.updateStatus(`正在加载卡片数据: ${cardId}`);
      
      const cardData = await iceService.fetchCardData(cardId, this.getCardType(cardId));
      
      const cardDataObj: CardData = {
        cardId: cardData.cardId,
        type: cardData.type,
        data: cardData.data
      };

      const chunks = dataProcessor.processCardData(cardDataObj);
      
      await dataProcessor.sendChunksWithBackpressure(chunks);

      this.updateStatus('Electron 工作台已就绪');

    } catch (error) {
      console.error(`[ElectronLauncher] Failed to load card data: ${cardId}`, error);
      this.sendError(cardId, error instanceof Error ? error.message : String(error));
    } finally {
      this.processingCards.delete(cardId);
    }
  }

  public requestCardData(cardIds: string[]): void {
    if (!this.isReady) {
      this.pendingCardIds = [...this.pendingCardIds, ...cardIds];
      return;
    }

    for (const cardId of cardIds) {
      this.loadCardData(cardId);
    }
  }

  private sendChunk(chunk: DataChunk): void {
    if (this.currentProcess?.process.connected) {
      this.currentProcess.process.send!({
        type: 'DATA_CHUNK',
        cardId: chunk.cardId,
        chunk: chunk.data,
        meta: {
          index: chunk.chunkIndex,
          total: chunk.totalChunks
        },
        isLast: chunk.isLast
      });
    }
  }

  private sendError(cardId: string, error: string): void {
    if (this.currentProcess?.process.connected) {
      this.currentProcess.process.send!({
        type: 'DATA_ERROR',
        cardId,
        error
      });
    }
  }

  private onChunkProcessed(cardId: string, chunkIndex: number): void {
    console.log(`[ElectronLauncher] Chunk processed: ${cardId} - ${chunkIndex}`);
  }

  private processNextChunk(cardId: string): void {
    console.log(`[ElectronLauncher] Request more data for: ${cardId}`);
  }

  private getCardType(cardId: string): 'echarts' | 'logicflow' | 'canvas' {
    if (cardId.includes('chart') || cardId.includes('1') || cardId.includes('echarts')) {
      return 'echarts';
    }
    if (cardId.includes('flow') || cardId.includes('2') || cardId.includes('logicflow')) {
      return 'logicflow';
    }
    return 'canvas';
  }

  public sendToElectron(message: object): void {
    if (this.currentProcess?.process.connected) {
      this.currentProcess.process.send!(message);
    } else {
      console.warn('[ElectronLauncher] Cannot send: process not connected');
    }
  }

  public terminate(): void {
    if (this.currentProcess) {
      iceService.cancelAllRequests();
      dataProcessor.clearAllPendingChunks();
      this.currentProcess.process.kill();
      this.currentProcess = null;
      this.isReady = false;
      this.updateStatus('Electron 工作台已关闭');
    }
  }

  private updateStatus(text: string): void {
    this.statusBarItem.text = `$(debug) ${text}`;
  }

  private findElectronPath(): string {
    const possiblePaths = [
      path.join(__dirname, '../../node_modules/electron/dist/electron.exe'),
      path.join(process.env.APPDATA || '', 'npm/node_modules/electron/dist/electron.exe'),
      path.join(process.env.LOCALAPPDATA || '', 'npm/node_modules/electron/dist/electron.exe'),
      'C:\\Program Files\\electron\\electron.exe',
      'electron',
      'npx electron'
    ];

    for (const p of possiblePaths) {
      if (p && fs.existsSync(p)) {
        return p;
      }
    }

    return 'npx electron';
  }

  private getMainProcessPath(): string | null {
    const possiblePaths = [
      path.join(__dirname, '../../dist-electron/main/index.js'),
      path.join(__dirname, '../dist-electron/main/index.js')
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }

    return null;
  }

  public dispose(): void {
    this.terminate();
    this.statusBarItem.dispose();
  }
}

let launcher: ElectronLauncher | null = null;

export function registerElectronCommands(context: vscode.ExtensionContext): void {
  launcher = new ElectronLauncher();

  const openCommand = vscode.commands.registerCommand('my-extension.openElectronWorkbench', async () => {
    await launcher?.launch();
  });

  const closeCommand = vscode.commands.registerCommand('my-extension.closeElectronWorkbench', () => {
    launcher?.terminate();
  });

  const sendDataCommand = vscode.commands.registerCommand('my-extension.sendDataToElectron', (data: object) => {
    launcher?.sendToElectron(data);
  });

  const loadDataCommand = vscode.commands.registerCommand('my-extension.loadCardData', async (cardId: string) => {
    await launcher?.loadCardData(cardId);
  });

  const requestDataCommand = vscode.commands.registerCommand('my-extension.requestCardData', (cardIds: string[]) => {
    launcher?.requestCardData(cardIds);
  });

  context.subscriptions.push(openCommand, closeCommand, sendDataCommand, loadDataCommand, requestDataCommand, launcher!);
}

export { ElectronLauncher };
