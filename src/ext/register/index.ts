import * as vscode from 'vscode';
import { DataPanelProvider } from '../providers/DataPanelProvider';
import { registerCommands } from './commands';
import { BitmapDataService } from '../bitmap/BitmapDataService';

export function registerAll(context: vscode.ExtensionContext, extensionUri: vscode.Uri): void {
  const bitmapDataService = new BitmapDataService();
  const dataPanelProvider = new DataPanelProvider(extensionUri, bitmapDataService);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      DataPanelProvider.viewType,
      dataPanelProvider
    )
  );

  registerCommands(context, extensionUri, bitmapDataService);

  console.log('[Extension] DataPanel registered');
}
