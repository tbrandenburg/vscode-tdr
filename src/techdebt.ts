import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { TechDebtSidebar } from './webview/sidebar';

export class TechDebt {
    constructor(context: vscode.ExtensionContext) {

        const sidebar = new TechDebtSidebar(context);
    
        // Use the console to output diagnostic information (console.log) and errors (console.error)
        // This line of code will only be executed once when your extension is activated
        console.log('Congratulations, your extension "vstechdebt" is now active!');
    
        context.subscriptions.push(
            vscode.commands.registerCommand('vstechdebt.addTechDebt', () => {

        // Get the root path of the current workspace
        const workspaceRoot = vscode.workspace.rootPath;

        if (workspaceRoot) {
            // Use the workspace root path to find all TDR files
            const files = vscode.workspace.findFiles('**/*.tdr', '**/node_modules/**', 1000);

            // Analyze each file
            files.then((uris) => {
                uris.forEach(uri => {
                    const filePath = uri.fsPath;
                    const fileName = path.basename(filePath);

                    // Read the contents of the file
                    fs.readFile(filePath, 'utf8', (err, data) => {
                        if (err) {
                            console.error(err);
                            return;
                        }

                        // Parse the TDR data
                        try {
                            const tdrData = JSON.parse(data);
                            console.log(`Successfully parsed TDR from file: ${fileName}`);
                            console.log(tdrData);
                        } catch (err) {
                            console.error(`Error parsing TDR from file: ${fileName}`);
                            console.error(err);
                        }
                    });
                });
            });
        } else {
            vscode.window.showErrorMessage('No workspace open');
        }
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
}

