// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { TechDebtSidebar } from './webview/sidebar';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const sidebar = new TechDebtSidebar(context);

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vstechdebt" is now active!');

	context.subscriptions.push(
		vscode.commands.registerCommand('vstechdebt.addTechDebt', () => {
			// The code you place here will be executed every time your command is executed
			// Display a message box to the user
			vscode.window.showInformationMessage('Hello World from vstechdebt!');
		}));

	// Register sidebar
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider("vstechdebt-sidebar", sidebar)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("vstechdebt.refresh", async () => {
			await vscode.commands.executeCommand("workbench.action.closeSidebar");
			await vscode.commands.executeCommand(
				"workbench.view.extension.vstechdebt-sidebar-view"
			);
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() { }
