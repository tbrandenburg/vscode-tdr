import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as crypto from 'crypto';

import { TechDocRecSidebar } from "./webview/sidebar";

import { Observable } from "./patterns/observer";

import { TechDocRec } from "./techdocrec";

export class TechDocRecs extends Observable {
    private _tdrs: { [id: string]: TechDocRec; } = {};

    private _diagnosticCollection: vscode.DiagnosticCollection = vscode.languages.createDiagnosticCollection('TechDocRecs');

    get techDocRecs(): { [id: string]: TechDocRec; } {
        return this._tdrs;
    }

    constructor(context: vscode.ExtensionContext) {

        super();

        const sidebar = new TechDocRecSidebar(context, this);

        // Register Listener for onDidChangeWorkspaceFolders event
        vscode.workspace.onDidChangeWorkspaceFolders(event => {
            this.getTechDocRecsInWorkspace();
        });

        context.subscriptions.push(vscode.commands.registerCommand('vscode-tdr.addExplorerADR', async (selectedResourceUri: vscode.Uri) => {

            const title = await vscode.window.showInputBox({
                prompt: 'Enter a title for the architecture decision record:',
                placeHolder: path.basename(selectedResourceUri.fsPath),
            });

            if (title) {
                this.createTDR(title, "decision", selectedResourceUri);
            }
        }));

        context.subscriptions.push(vscode.commands.registerCommand('vscode-tdr.addExplorerTechDebt', async (selectedResourceUri: vscode.Uri) => {

            const title = await vscode.window.showInputBox({
                prompt: 'Enter a title for the technical debt record:',
                placeHolder: path.basename(selectedResourceUri.fsPath),
            });

            if (title) {
                this.createTDR(title, "debt", selectedResourceUri);
            }
        }));

        context.subscriptions.push(vscode.commands.registerCommand('vscode-tdr.addExplorerTechDoc', async (selectedResourceUri: vscode.Uri) => {

            const tdrTypes = [
                { label: "debt",          description: "Technical Debt" },
                { label: "decision",      description: "Architecture/Design Decision" },
                { label: "doc",           description: "Documentation" },
                { label: "bug",           description: "Bug" },
                { label: "vulnerability", description: "Vulnerability" },
                { label: "smell",         description: "Smell" },
                { label: "style",         description: "Style" },
                { label: "todo",          description: "TODO" },
                { label: "fixme",         description: "FIXME" },
                { label: "info",          description: "INFO" }
            ];

            const tdrType = await vscode.window.showQuickPick(
                tdrTypes,
                {
                    placeHolder: 'Select a type',
                    title: 'Type of the technical doc record'
                }
            );

            const title = await vscode.window.showInputBox({
                prompt: 'Enter a title for the technical doc record:',
                placeHolder: path.basename(selectedResourceUri.fsPath),
            });

            if (tdrType && title) {
                this.createTDR(title, tdrType.label, selectedResourceUri);
            }
        }));

        context.subscriptions.push(vscode.commands.registerCommand('vscode-tdr.addEditorTechDebt', async (selectedResourceUri: vscode.Uri) => {
            let editor = vscode.window.activeTextEditor;
            if (!editor) {
                return; // No active editor
            }
            let selection = editor.selection;

            const title = await vscode.window.showInputBox({
                prompt: 'Enter a title for the technical debt record:',
                placeHolder: path.basename(selectedResourceUri.fsPath),
            });

            if (title) {
                if (selection.isEmpty) {
                    let cursorPosition = editor.selection.active;
                    this.createTDR(title, "debt", selectedResourceUri, cursorPosition.line, cursorPosition.character, cursorPosition.line, cursorPosition.character);
                } else {
                    this.createTDR(title, "debt", selectedResourceUri, selection.start.line, selection.start.character, selection.end.line, selection.end.character);
                }
            }
        }));

        context.subscriptions.push(vscode.commands.registerCommand('vscode-tdr.addEditorTechDoc', async (selectedResourceUri: vscode.Uri) => {
            let editor = vscode.window.activeTextEditor;
            if (!editor) {
                return; // No active editor
            }
            let selection = editor.selection;

            const tdrTypes = [
                { label: "debt",          description: "Technical Debt" },
                { label: "decision",      description: "Architecture/Design Decision" },
                { label: "doc",           description: "Documentation" },
                { label: "bug",           description: "Bug" },
                { label: "vulnerability", description: "Vulnerability" },
                { label: "smell",         description: "Smell" },
                { label: "style",         description: "Style" },
                { label: "todo",          description: "TODO" },
                { label: "fixme",         description: "FIXME" },
                { label: "info",          description: "INFO" }
            ];

            const tdrType = await vscode.window.showQuickPick(
                tdrTypes,
                {
                    placeHolder: 'Select a type',
                    title: 'Type of the technical doc record'
                }
            );

            const title = await vscode.window.showInputBox({
                prompt: 'Enter a title for the technical doc record:',
                placeHolder: path.basename(selectedResourceUri.fsPath),
            });

            if (tdrType && title) {
                if (selection.isEmpty) {
                    let cursorPosition = editor.selection.active;
                    this.createTDR(title, "debt", selectedResourceUri, cursorPosition.line, cursorPosition.character, cursorPosition.line, cursorPosition.character);
                } else {
                    this.createTDR(title, "debt", selectedResourceUri, selection.start.line, selection.start.character, selection.end.line, selection.end.character);
                }
            }
        }));

        // Register sidebar
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider("vscode-tdr-sidebar", sidebar)
        );

        // Let sidebar observe TDRs
        this.addObserver(sidebar);

        this.getTechDocRecsInWorkspace();
    }

    private initTDR(tdr: TechDocRec, title: string, type: string) {
        const currentDate = new Date();

        const day = currentDate.getDate().toString().padStart(2, "0");
        const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
        const year = currentDate.getFullYear().toString();

        const formattedDate = `${year}-${month}-${day}`;

        tdr.metadata = {
            title: title,
            author: os.userInfo().username,
            date: formattedDate
        };

        this.initId(tdr);

        tdr.description = os.EOL + "# " + title + os.EOL + os.EOL;

        var template = ["Description"];

        if (type) {
            switch (type) {
                case "debt":
                    template = (vscode.workspace.getConfiguration().get<string>('vscode-tdr.template.debt') || ["Description"]) as string[];
                    break;
                case "decision":
                    template = (vscode.workspace.getConfiguration().get<string>('vscode-tdr.template.adr') || ["Description"]) as string[];
                    break;
                default:
                    break;
            }
            tdr.type = type;
        }

        template.forEach(chapter => {
            tdr.description += "## " + chapter + os.EOL + os.EOL;
        });
    }

    private initId(tdr: TechDocRec) {
        do {
            tdr.id = "TDR_" + crypto.createHash('sha256').update((tdr.title) + new Date()).digest('hex').toUpperCase().substring(0, 8);
        } while (tdr.id in this._tdrs);
    }

    // Creates a new technical doc record and therewith registers and persists the same
    private async createTDR(title: string, type: string, uri: vscode.Uri, startLine?: number, startColumn?: number, endLine?: number, endColumn?: number) {
        if (vscode.workspace.workspaceFolders !== undefined) {

            const tdr = new TechDocRec();
            this.initTDR(tdr, title, type);
            tdr.file = path.relative(vscode.workspace.workspaceFolders[0].uri.fsPath, uri.fsPath);

            const tdrRelFileDirs = [
                { label: path.join(path.dirname(path.relative(vscode.workspace.workspaceFolders[0].uri.fsPath, uri.fsPath)), vscode.workspace.getConfiguration().get<string>('vscode-tdr.folder.name') || ".tdr"), description: "In place" },
                { label: vscode.workspace.getConfiguration().get<string>('vscode-tdr.folder.tdr.root') || "doc/tdr", description: "Root technical doc record location" },
                { label: vscode.workspace.getConfiguration().get<string>('vscode-tdr.folder.adr.root') || "doc/adr", description: "Root any decision record location" },
            ];

            const tdrRelFileDir = await vscode.window.showQuickPick(
                tdrRelFileDirs,
                {
                    placeHolder: 'Select an option',
                    title: 'Location for technical doc record (relative to project root)'
                }
            );

            if (tdrRelFileDir) {
                const tdrAbsFileDir = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, tdrRelFileDir.label);

                const tdrFileName = getTdrFileName(tdr, tdrAbsFileDir);

                const tdrFilePath = path.join(tdrAbsFileDir, tdrFileName);

                // Set TDR URI
                tdr.tdrFile = vscode.Uri.file(tdrFilePath);

                if (startLine) {
                    tdr.startLine = startLine;
                }
                if (startColumn) {
                    tdr.startColumn = startColumn;
                }
                if (endLine) {
                    tdr.endLine = endLine;
                }
                if (endColumn) {
                    tdr.endColumn = endColumn;
                }

                await tdr.persist();

                this.registerTechDocRec(tdr);

                this.showTechDocRec(tdr);
            }
        }

        function getTdrFileName(tdr: TechDocRec, tdrAbsFileDir: string) {
            var newNum = 0;
            if (fs.existsSync(tdrAbsFileDir)) {
                const files = fs.readdirSync(tdrAbsFileDir)
                    .filter((file) => /^\d+/.test(file));

                const numbers = files.map((file) => parseInt(file, 10))
                    .filter((number) => !isNaN(number))
                    .sort((a, b) => b - a);

                if (numbers && !isNaN(numbers[0])) {
                    newNum = numbers[0];
                }
            }
            return String(newNum + 1).padStart(4, '0') + '-' + tdr.title.replace(/\s+/g, '-').replace(/[^\w-]/gi, '') + ".md";
        }
    }

    private async removeTDR(tdr: TechDocRec) {
        await tdr.remove();

        this.unregisterTechDocRec(tdr);
    }

    private raiseProblem(tdr: TechDocRec) {
        const diagnostic = tdr.getDiagnostic();
        if (diagnostic) {
            if (vscode.workspace.workspaceFolders !== undefined) {
                const uri = vscode.Uri.file(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, tdr.file));
                var dcarr = this._diagnosticCollection.get(uri)?.slice() as vscode.Diagnostic[];
                dcarr.push(diagnostic);
                this._diagnosticCollection.set(uri, dcarr);
            }
        }
    }

    private removeProblem(tdr: TechDocRec) {
        const diagnostic = tdr.getDiagnostic();
        if (diagnostic) {
            if (vscode.workspace.workspaceFolders !== undefined) {
                const uri = vscode.Uri.file(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, tdr.file));
                var dcarr = this._diagnosticCollection.get(uri)?.slice() as vscode.Diagnostic[];
                dcarr = dcarr.filter(item => item.code !== tdr.id);
                this._diagnosticCollection.set(uri, dcarr);
            }
        }
    }

    // Add technical doc record and publish technical doc record to UI
    private registerTechDocRec(tdr: TechDocRec) {
        // Raise item in problem view
        this.raiseProblem(tdr);

        // Add to technical doc record array
        this._tdrs[tdr.id] = tdr;

        if (tdr.tdrFile) {
            // Register file watcher
            tdr.fileWatcher = vscode.workspace.createFileSystemWatcher(tdr.tdrFile.fsPath);
            const tdrId = tdr.id;

            // Register a callback function for when the file is changed
            tdr.fileWatcher.onDidChange(async (uri: vscode.Uri) => {
                await this.readTDR(uri)
                    .then((td) => {
                        if (this._tdrs[tdrId]) {
                            this._tdrs[tdrId] = td;
                            this.notifyObservers(this._tdrs);
                        }
                    })
                    .catch((error) => {
                        console.warn(uri.fsPath + ": " + error);
                    });
            });
        } else {
            console.error("Undefined TDR file!");
        }

        // Inform observers
        this.notifyObservers(this._tdrs);
    }

    // Remove technical doc record and update UI
    private unregisterTechDocRec(tdr: TechDocRec) {
        // Remove item in problem view
        this.removeProblem(tdr);

        // Remove from technical doc record array
        delete this._tdrs[tdr.id];

        if (tdr.fileWatcher) {
            tdr.fileWatcher.dispose();
        }

        // Inform observers
        this.notifyObservers(this._tdrs);
    }

    // Show up technical doc record
    private showTechDocRec(tdr: TechDocRec) {

        if (tdr.tdrFile) {
            // Open editor and markdown
            vscode.window.showTextDocument(tdr.tdrFile, {
                preview: false,
                viewColumn: vscode.ViewColumn.One
            }).then(editor => {
                vscode.commands.executeCommand('markdown.showPreviewToSide');
            });
        } else {
            vscode.window.showErrorMessage("No technical doc record found!");
        }
    }

    // Reads a TDR based on an URI for internal usage
    private readTDR(uri: vscode.Uri): Promise<TechDocRec> {

        const filePath = uri.fsPath;

        return new Promise((resolve, reject) => {
            // Read the contents of the file
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    // Parse the TDR data
                    try {
                        const td = new TechDocRec();
                        td.tdrFile = uri;
                        td.fromString(data);
                        this.initId(td);
                        resolve(td);
                    } catch (err) {
                        reject(err);
                    }
                }
            });
        });
    }

    // Collects present TDRs in workspace and registers them
    private getTechDocRecsInWorkspace() {

        if (vscode.workspace.workspaceFolders !== undefined) {
            // Use the workspace root path to find all TDR files
            const files = vscode.workspace.findFiles('**/[0-9]*-*.md', '**/node_modules/**');

            // Analyze each file
            files.then((uris) => {
                uris.forEach(async uri => {
                    await this.readTDR(uri)
                        .then((td) => {
                            this.registerTechDocRec(td);
                        })
                        .catch((error) => {
                            console.warn(uri.fsPath + ": " + error);
                        });
                });
            });
        } else {
            // Nothing to do
        }
    }

    // Notification function in case a present technical doc record has changed based on user input
    public update(id: string) {
        if (id) {
            const tdr = this.techDocRecs[id];
            if (tdr) {
                // Inform observers
                this.notifyObservers(this._tdrs);

                tdr.persist();
            }
        }
    }

    // Technical doc record should be removed based on user input
    public remove(id: string) {
        if (id) {
            const tdr = this.techDocRecs[id];
            if (tdr) {
                vscode.window
                    .showInformationMessage("Do you really want to remove " + id + "?", "Yes", "No")
                    .then(answer => {
                        if (answer === "Yes") {
                            this.removeTDR(tdr);
                        }
                    });
            }
        }
    }
}

