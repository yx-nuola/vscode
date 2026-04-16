import * as vscode from 'vscode';
import { registerAll } from './ext';
import { registerElectronCommands } from './ext/electron/launcher';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "my-extension" is now active!');

	const extensionUri = context.extensionUri;
	registerAll(context, extensionUri);

	registerElectronCommands(context);

	const disposable = vscode.commands.registerCommand('my-extension.helloWorld', () => {
		const input = vscode.window.showInputBox({
			prompt: "请输入要验证的内容",
			placeHolder: "例如：邮箱、手机号、JSON 等"
		});

		input.then(value => {
			if (!value) {
				vscode.window.showWarningMessage("未输入任何内容");
				return;
			}

			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (emailRegex.test(value)) {
				vscode.window.showInformationMessage(`✅ "${value}" 是有效的邮箱！`);
			} else {
				vscode.window.showErrorMessage(`❌ "${value}" 不是有效的邮箱。`);
			}
		});
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
