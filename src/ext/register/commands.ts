import * as vscode from 'vscode';
import { BitmapDataService } from '../bitmap/BitmapDataService';
import { BitmapEditorPanel } from '../providers/BitmapEditorPanel';

export function registerCommands(
  context: vscode.ExtensionContext,
  extensionUri: vscode.Uri,
  bitmapDataService: BitmapDataService
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('my-extension.openDataPanel', async () => {
      await vscode.commands.executeCommand('my-extension.dataPanel.focus');
    }),
    vscode.commands.registerCommand('my-extension.openBitmapEditor', () => {
      BitmapEditorPanel.open(extensionUri, bitmapDataService);
    })
  );
}
