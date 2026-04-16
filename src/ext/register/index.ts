import * as vscode from 'vscode';
import { DataPanelProvider } from '../providers/DataPanelProvider';
import { registerCommands } from './commands';

export function registerAll(context: vscode.ExtensionContext, extensionUri: vscode.Uri): void {
  const dataPanelProvider = new DataPanelProvider(extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      DataPanelProvider.viewType,
      dataPanelProvider
    )
  );

  registerCommands(context);

  console.log('[Extension] DataPanel registered');
}
