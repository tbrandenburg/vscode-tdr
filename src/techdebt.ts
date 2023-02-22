import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as crypto from 'crypto';

import { TechDebtSidebar } from './webview/sidebar';

interface ITechDebt {
    id?: string;
    brief: string;
    author?: string;
    date?: string;
    description?: string;
    owner?: string;
    category?: string;
    severity?: string;
    priority?: string;
    file: string;
    line?: number;
    column?: number;
    votes?: number;
    workitem?: string;
    cost?: string;
    effort?: string;
    impedes?: string;
    discussion?: any[];
    tags?: string[];
}

export class TechDebts {
    constructor(context: vscode.ExtensionContext) {

        const sidebar = new TechDebtSidebar(context);

        // Register Listener for onDidChangeWorkspaceFolders event
        vscode.workspace.onDidChangeWorkspaceFolders(event => {
            this.getTechDebtsInWorkspace();
        });

        context.subscriptions.push(vscode.commands.registerCommand('vstechdebt.addTechDebt', async (selectedResourceUri: vscode.Uri) => {
            this.addTechDebt(selectedResourceUri);
        }));

        this.getTechDebtsInWorkspace();
    }

    private async addTechDebt(uri: vscode.Uri) {

        var brief = await vscode.window.showInputBox({
            prompt: 'Enter a brief description for the technical debt:',
            placeHolder: path.basename(uri.fsPath),
        });

        if (brief && (vscode.workspace.workspaceFolders !== undefined)) {
            var tdFileName = brief.replace(/\s+/g, '-');
            tdFileName = tdFileName.replace(/[^\w-]/gi, '') + ".tdr";

            const currentDate = new Date();
    
            const day = currentDate.getDate().toString().padStart(2, "0");
            const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
            const year = currentDate.getFullYear().toString();
    
            const formattedDate = `${year}-${month}-${day}`;

            const techDebt: ITechDebt = {
                id: "TDR_" + crypto.createHash('sha256').update(brief + currentDate).digest('hex').toUpperCase().substring(0, 8),
                brief: brief,
                author: os.userInfo().username,
                date: formattedDate,
                file: path.relative(vscode.workspace.workspaceFolders[0].uri.fsPath, uri.fsPath),
                line: 0,
                column: 0
            };
            const tdFilePath = path.join(path.dirname(uri.fsPath), ".tdr", tdFileName);

            const jsonString = JSON.stringify(techDebt, null, 4);

            fs.mkdir(path.dirname(tdFilePath), { recursive: true }, (err) => {
                if (err) {
                    vscode.window.showErrorMessage("Error creating directory: " + path.dirname(tdFilePath));
                    return;
                }

                fs.writeFile(tdFilePath, jsonString, (err) => {
                    if (err) {
                        vscode.window.showErrorMessage("Error creating file: " + tdFilePath);
                        return;
                    }
                    vscode.window.showInformationMessage("Sucessfully created " + tdFilePath + "!");
                    this.createProblem(techDebt);
                });
            });

        }
    }

    private getTechDebtsInWorkspace() {

        if (vscode.workspace.workspaceFolders !== undefined) {
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
                            this.createProblem(JSON.parse(data));
                            console.log(`Successfully parsed TDR from file: ${fileName}`);
                        } catch (err) {
                            console.error(`Error parsing TDR from file: ${fileName}`);
                            console.error(err);
                        }
                    });
                });
            });
        } else {
            // Nothing to do
        }
    }

    private createProblem(td: ITechDebt) {
        if (vscode.workspace.workspaceFolders !== undefined) {
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(td.line || 0, td.column || 0, td.line || 0, td.column || 0),
                td.brief
            );
            switch (td.severity) {
                case "error":
                    diagnostic.severity = vscode.DiagnosticSeverity.Warning;
                    break;
                case "information":
                    diagnostic.severity = vscode.DiagnosticSeverity.Information;
                    break;
                case "hint":
                    diagnostic.severity = vscode.DiagnosticSeverity.Hint;
                    break;
                default:
                    diagnostic.severity = vscode.DiagnosticSeverity.Warning;
                    break;
            }
            const uri = vscode.Uri.file(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, td.file));
            const diagnostics = vscode.languages.createDiagnosticCollection('TechDebts');
            diagnostics.set(uri, [diagnostic]);
        }
    }
}

