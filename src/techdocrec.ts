import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as crypto from 'crypto';

const fm = require('front-matter');
const yaml = require('js-yaml');

import { TechDocRecSidebar } from './webview/sidebar';

import { Observable } from './patterns/observer';
import { parse } from 'path';

interface ITechDocRecMetadataExt extends ITechDocRecMetadata {
    [key: string]: any;
}

interface ITechDocRecMetadata {
    id?: string;                 // Identifier of the technical doc record
    title: string;               // Title of the technical doc record
    author?: string;             // Author of the technical doc record record
    date?: string;               // Date of the technical doc record record
    owner?: string;              // Solution owner/Responsible
    status?: string;             // Such as new, in progress, closed, deferred
    resolution?: string;         // Such as open, solved, invalid, duplicate
    type?: string;               // Type of technical doc record record, e.g. Decision, Technical Debt, TODO, FIXME, INFO etc.
    severity?: string;           // Such as minor, normal, major, critical, blocker (+warning, information)
    priority?: string;           // Such as low, medium, high
    file?: string;               // Location of technical doc record
    startLine?: number;
    startColumn?: number;
    endLine?: number;
    endColumn?: number;
    workitem?: string;           // Ticket URL/Id
    cost?: string;               // Such as low, medium, high
    effort?: string;             // Such as low, medium, high
    detectionPhase?: string;     // When it was detected?
    detectionMethod?: string;    // How it was detected?
    injectionPhase?: string;     // When it was injected/created?
    injectionQualifier?: string; // Why it was injected/created?
    tags?: string;               // Tags for filtering
    requirements?: string;       // Satisfied requirements
}

interface ITechDocRec {
    metadata: ITechDocRecMetadataExt;
    description?: string;
}

class TechDocRec {
    public resource: ITechDocRec = {
        metadata: {
            title: ""
        }
    };

    private _tdrFile: vscode.Uri | undefined;
    private _discussion: any[] = [];
    private _votes: string[] = [];
    private _fileWatcher: vscode.FileSystemWatcher | undefined;

    constructor() {
        this.init();
    }

    get metadata(): ITechDocRecMetadataExt {
        return this.resource.metadata;
    }

    set metadata(techDocRec: ITechDocRecMetadataExt) {
        this.resource.metadata = techDocRec;
    }

    get id(): string {
        return this.resource.metadata.id || "";
    }

    get title(): string {
        return this.resource.metadata.title;
    }

    get author(): string {
        return this.resource.metadata.author || "";
    }

    get date(): string {
        return this.resource.metadata.date || "";
    }

    get owner(): string {
        return this.resource.metadata.owner || "";
    }

    get status(): string {
        return this.resource.metadata.status || "";
    }

    get resolution(): string {
        return this.resource.metadata.resolution || "";
    }

    get type(): string {
        return this.resource.metadata.type || "";
    }

    get severity(): string {
        return this.resource.metadata.severity || "";
    }

    get priority(): string {
        return this.resource.metadata.priority || "";
    }

    get file(): string {
        return this.resource.metadata.file || ".";
    }

    get startLine(): number {
        return this.resource.metadata.startLine || 0;
    }

    get startColumn(): number {
        return this.resource.metadata.startColumn || 0;
    }

    get endLine(): number {
        return this.resource.metadata.endLine || 0;
    }

    get endColumn(): number {
        return this.resource.metadata.endColumn || 0;
    }

    get votes(): string[] {
        return this._votes || [];
    }

    get discussion(): any[] {
        return this._discussion || [];
    }

    get description(): string {
        return this.resource.description || "";
    }

    get tdrFile(): any {
        return this._tdrFile;
    }

    get fileWatcher(): any {
        return this._fileWatcher;
    }

    set id(id: string) {
        this.resource.metadata.id = id;
    }

    set title(title: string) {
        this.resource.metadata.title = title;
    }

    set author(author: string) {
        this.resource.metadata.author = author;
    }

    set date(date: string) {
        this.resource.metadata.date = date;
    }

    set owner(owner: string) {
        this.resource.metadata.owner = owner;
    }

    set status(status: string) {
        this.resource.metadata.status = status;
    }

    set resolution(resolution: string) {
        this.resource.metadata.resolution = resolution;
    }

    set type(type: string) {
        this.resource.metadata.type = type;
    }

    set severity(severity: string) {
        this.resource.metadata.severity = severity;
    }

    set priority(priority: string) {
        this.resource.metadata.priority = priority;
    }

    set file(file: string) {
        this.resource.metadata.file = file;
    }

    set startLine(line: number) {
        this.resource.metadata.startLine = line;
    }

    set startColumn(column: number) {
        this.resource.metadata.startColumn = column;
    }

    set endLine(line: number) {
        this.resource.metadata.endLine = line;
    }

    set endColumn(column: number) {
        this.resource.metadata.endColumn = column;
    }

    set votes(votes: string[]) {
        this._votes = votes;
    }

    set description(description: string) {
        this.resource.description = description;
    }

    public addVote(vote: string) {
        if (this._votes) {
            this._votes.push(vote);
        } else {
            this._votes = [vote];
        }
    }

    set discussion(discussion: string[]) {
        this._discussion = discussion;
    }

    set tdrFile(tdrFile: vscode.Uri) {
        this._tdrFile = tdrFile;
    }

    set fileWatcher(fw: vscode.FileSystemWatcher) {
        this._fileWatcher = fw;
    }

    public addComment(comment: string[]) {
        if (this._discussion) {
            this._discussion.push(comment);
        } else {
            this._discussion = [comment];
        }
    }

    public getDiagnostic(): any {
        const diagnostic = new vscode.Diagnostic(
            new vscode.Range(this.startLine, this.startColumn, this.endLine, this.endColumn),
            this.title
        );

        diagnostic.source = this.type || "";

        diagnostic.code = this.id;

        switch (this.severity) {
            case "error":
                diagnostic.severity = vscode.DiagnosticSeverity.Error;
                break;
            case "major":
                diagnostic.severity = vscode.DiagnosticSeverity.Error;
                break;
            case "critical":
                diagnostic.severity = vscode.DiagnosticSeverity.Error;
                break;
            case "blocker":
                diagnostic.severity = vscode.DiagnosticSeverity.Error;
                break;
            case "minor":
                diagnostic.severity = vscode.DiagnosticSeverity.Information;
                break;
            case "information":
                diagnostic.severity = vscode.DiagnosticSeverity.Information;
                break;
            default:
                switch (this.type) {
                    case "debt":
                        diagnostic.severity = vscode.DiagnosticSeverity.Warning;
                        break;
                    case "bug":
                        diagnostic.severity = vscode.DiagnosticSeverity.Error;
                        break;
                    case "vulnerability":
                        diagnostic.severity = vscode.DiagnosticSeverity.Warning;
                        break;
                    case "smell":
                        diagnostic.severity = vscode.DiagnosticSeverity.Warning;
                        break;
                    case "style":
                        diagnostic.severity = vscode.DiagnosticSeverity.Information;
                        break;
                    case "todo":
                        diagnostic.severity = vscode.DiagnosticSeverity.Warning;
                        break;
                    case "fixme":
                        diagnostic.severity = vscode.DiagnosticSeverity.Warning;
                        break;
                    case "info":
                        diagnostic.severity = vscode.DiagnosticSeverity.Information;
                        break;
                    case "decision":
                        diagnostic.severity = vscode.DiagnosticSeverity.Information;
                        break;
                    default:
                        diagnostic.severity = vscode.DiagnosticSeverity.Warning;
                        break;
                }
                break;
        }
        return diagnostic;
    }

    public setAttribute(attribute: string, value: any) {
        if (value) {
            this.resource.metadata[attribute] = value;
        }
    }

    public toString(): string {
        return "---" + os.EOL + yaml.dump(this.metadata) + "---" + os.EOL + this.description;
    }

    public fromString(mmd: string) {
        const parsedData = fm(mmd);

        if (parsedData) {
            if (parsedData.attributes && Object.keys(parsedData.attributes).length > 0) {
                this.metadata = parsedData.attributes;

                this.description = parsedData.body;
            } else {
                throw new Error("Could not find YAML attributes in file!")
            }
        } else {
            throw new Error("Could not parse file!")
        }

    }

    public init(title?: string, type?: string) {
        const currentDate = new Date();

        const day = currentDate.getDate().toString().padStart(2, "0");
        const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
        const year = currentDate.getFullYear().toString();

        const formattedDate = `${year}-${month}-${day}`;

        this.metadata = {
            id: "TDR_" + crypto.createHash('sha256').update((title || "") + currentDate).digest('hex').toUpperCase().substring(0, 8),
            title: title || "",
            author: os.userInfo().username,
            date: formattedDate
        };

        this.description = os.EOL + "# " + title + os.EOL + os.EOL;

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
            this.type = type;
        }

        template.forEach(chapter => {
            this.description += "## " + chapter + os.EOL + os.EOL;
        });

    }

    // Stores TDR on disk
    public persist(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this.tdrFile) {
                const tdrPath = this.tdrFile.fsPath;
                fs.mkdir(path.dirname(tdrPath), { recursive: true }, (err) => {
                    if (err) {
                        vscode.window.showErrorMessage("Error creating directory: " + path.dirname(tdrPath));
                        reject(err);
                    } else {
                        fs.writeFile(tdrPath, this.toString(), (err) => {
                            if (err) {
                                vscode.window.showErrorMessage("Error creating file: " + tdrPath);
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    }
                });
            }
        });
    }

    // Removes TDR from disk
    public remove(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this.tdrFile) {
                const tdrPath = this.tdrFile.fsPath;
                fs.unlink(tdrPath, (err) => {
                    if (err) {
                        vscode.window.showErrorMessage("Error deleting file: " + tdrPath);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    }
}

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
            this.createTDR("decision", selectedResourceUri);
        }));

        context.subscriptions.push(vscode.commands.registerCommand('vscode-tdr.addExplorerTechDebt', async (selectedResourceUri: vscode.Uri) => {
            this.createTDR("debt", selectedResourceUri);
        }));

        context.subscriptions.push(vscode.commands.registerCommand('vscode-tdr.addEditorTechDebt', async (selectedResourceUri: vscode.Uri) => {
            let editor = vscode.window.activeTextEditor;
            if (!editor) {
                return; // No active editor
            }
            let selection = editor.selection;
            if (selection.isEmpty) {
                let cursorPosition = editor.selection.active;
                this.createTDR("debt", selectedResourceUri, cursorPosition.line, cursorPosition.character, cursorPosition.line, cursorPosition.character);
            } else {
                this.createTDR("debt", selectedResourceUri, selection.start.line, selection.start.character, selection.end.line, selection.end.character);
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

    // Creates a new technical doc record and therewith registers and persists the same
    private async createTDR(type: string, uri: vscode.Uri, startLine?: number, startColumn?: number, endLine?: number, endColumn?: number) {

        var title = await vscode.window.showInputBox({
            prompt: 'Enter a title for the technical doc record:',
            placeHolder: path.basename(uri.fsPath),
        });

        if (title && (vscode.workspace.workspaceFolders !== undefined)) {

            const tdr = new TechDocRec();
            tdr.init(title, type);
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
                const tdrFileName = tdr.title.replace(/\s+/g, '-').replace(/[^\w-]/gi, '') + ".md";

                const tdrFilePath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, tdrRelFileDir.label, tdrFileName);

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
                        td.fromString(data);
                        td.tdrFile = uri;
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
                    })
            }
        }
    }
}

