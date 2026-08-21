import * as vscode from 'vscode';
import { DataPanelProvider } from '../providers/DataPanelProvider';
import { registerMessengerHandlers } from '../messenger/registerHandlers';
import { registerCommands } from './commands';

export function registerAll(context: vscode.ExtensionContext, extensionUri: vscode.Uri): void {
  const dataPanelProvider = new DataPanelProvider(extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(DataPanelProvider.viewType, dataPanelProvider)
  );

  registerMessengerHandlers(context);
  registerCommands(context);

  console.log('[Extension] DataPanel registered');
}
