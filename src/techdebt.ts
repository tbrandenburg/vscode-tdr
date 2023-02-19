import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

import { TechDebtSidebar } from './webview/sidebar';

class TechDebt {
    id: string = "";
    brief: string = "";
    author: string = "";
    date: string = "";
    description: string = "";
    owner: string = "";
    category: string = "techdebt";
    severity: string = "warning";
    priority: string = "";
    file: string = ".";
    line: number = 0;
    column: number = 0;
    votes: number = 1;
    workitem: string = "";
    cost: string = "";
    effort: string = "";
    impedes: string = "";
    discussion: any[] = [];
    tags: string[] = [];

    constructor(brief: string) {

        const currentDate = new Date();

        const day = currentDate.getDate().toString().padStart(2, "0");
        const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
        const year = currentDate.getFullYear().toString();

        const formattedDate = `${year}-${month}-${day}`;

        this.brief = brief;

        this.author = os.userInfo().username;

        this.date = formattedDate;
    }

    static fromJSON(json: string): TechDebt {
        const obj = JSON.parse(json);
        const td = new TechDebt(obj.brief);
        return td;
    }
}

export class TechDebts {
    constructor(context: vscode.ExtensionContext) {

        const sidebar = new TechDebtSidebar(context);

        // Register Listener for onDidChangeWorkspaceFolders event
        vscode.workspace.onDidChangeWorkspaceFolders(event => {
            this.getTechDebtsInWorkspace();
        });

        this.getTechDebtsInWorkspace();
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
                            this.createProblem(TechDebt.fromJSON(data));
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

    private createProblem(td: TechDebt) {
        const diagnostic = new vscode.Diagnostic(
            new vscode.Range(td.line, td.column, td.line, td.column), // Bereich des Problems
            td.brief, // Beschreibung des Problems
            vscode.DiagnosticSeverity.Warning // Schweregrad des Problems
        );
        const uri = vscode.Uri.file(td.file);
        const diagnostics = vscode.languages.createDiagnosticCollection('TechDebts');
        diagnostics.set(uri, [diagnostic]);
    }
}

