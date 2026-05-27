import * as vscode from 'vscode';
import { openBitmapEditorPanel } from '../webviews/openBitmapEditor';

export function registerCommands(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('my-extension.openDataPanel', async () => {
      await vscode.commands.executeCommand('my-extension.dataPanel.focus');
    }),
    vscode.commands.registerCommand('my-extension.openBitmapEditor', () => {
      openBitmapEditorPanel(context);
    })
  );
}
