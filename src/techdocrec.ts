import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as crypto from 'crypto';

const fm = require('front-matter');
const yaml = require('js-yaml');

import { TechDocRecSidebar } from './webview/sidebar';

import { Observable } from './patterns/observer';

interface ITechDocRecMetadata {
    id?: string;                 // Identifier of the technical doc record
    title: string;               // Title of the technical doc record
    author?: string;             // Author of the technical doc record record
    date?: string;               // Date of the technical doc record record
    owner?: string;              // Solution owner/Responsible
    status?: string;             // Such as new, in progress, closed, deferred
    resolution?: string;         // Such as open, solved, invalid, duplicate
    type?: string;               // Type of technical doc record record, e.g. Decision, Technical Debt, TODO, FIXME, INFO etc.
    severity?: string;           // Such as minor, normal, major, critical, blocker (+warning, information, hint)
    priority?: string;           // Such as low, medium, high
    file?: string;               // Location of technical doc record
    startLine?: number;
    startColumn?: number;
    endLine?: number;
    endColumn?: number;
    workitem?: string[];         // Ticket URL/Id
    cost?: string;               // Such as low, medium, high
    effort?: string;             // Such as low, medium, high
    detectionPhase?: string;     // When it was detected?
    detectionMethod?: string;    // How it was detected?
    injectionPhase?: string;     // When it was injected/created?
    injectionQualifier?: string; // Why it was injected/created?
    tags?: string[];
}

interface ITechDocRec {
    metadata: ITechDocRecMetadata;
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

    constructor() {
        this.init();
    }

    get metadata(): ITechDocRecMetadata {
        return this.resource.metadata;
    }

    set metadata(techDocRec: ITechDocRecMetadata) {
        this.title = techDocRec.title;
        if (techDocRec.file) { this.file = techDocRec.file; };
        if (techDocRec.id) { this.id = techDocRec.id; };
        if (techDocRec.author) { this.author = techDocRec.author; };
        if (techDocRec.date) { this.date = techDocRec.date; };
        if (techDocRec.owner) { this.owner = techDocRec.owner; };
        if (techDocRec.status) { this.status = techDocRec.status; };
        if (techDocRec.resolution) { this.resolution = techDocRec.resolution; };
        if (techDocRec.type) { this.type = techDocRec.type; };
        if (techDocRec.severity) { this.severity = techDocRec.severity; };
        if (techDocRec.priority) { this.priority = techDocRec.priority; };
        if (techDocRec.startLine) { this.startLine = techDocRec.startLine; };
        if (techDocRec.startColumn) { this.startColumn = techDocRec.startColumn; };
        if (techDocRec.endLine) { this.endLine = techDocRec.endLine; };
        if (techDocRec.endColumn) { this.endColumn = techDocRec.endColumn; };
        if (techDocRec.workitem) { this.workitem = techDocRec.workitem; };
        if (techDocRec.cost) { this.cost = techDocRec.cost; };
        if (techDocRec.effort) { this.effort = techDocRec.effort; };
        if (techDocRec.detectionPhase) { this.detectionPhase = techDocRec.detectionPhase; };
        if (techDocRec.detectionMethod) { this.detectionMethod = techDocRec.detectionMethod; };
        if (techDocRec.injectionPhase) { this.injectionPhase = techDocRec.injectionPhase; };
        if (techDocRec.injectionQualifier) { this.injectionQualifier = techDocRec.injectionQualifier; };
        if (techDocRec.tags) { this.tags = techDocRec.tags; };
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

    get workitem(): string[] {
        return this.resource.metadata.workitem || [];
    }

    get cost(): string {
        return this.resource.metadata.cost || "";
    }

    get effort(): string {
        return this.resource.metadata.effort || "";
    }

    get detectionPhase(): string {
        return this.resource.metadata.detectionPhase || "";
    }

    get detectionMethod(): string {
        return this.resource.metadata.detectionMethod || "";
    }

    get injectionPhase(): string {
        return this.resource.metadata.injectionPhase || "";
    }

    get injectionQualifier(): string {
        return this.resource.metadata.injectionQualifier || "";
    }

    get votes(): string[] {
        return this._votes || [];
    }

    get discussion(): any[] {
        return this._discussion || [];
    }

    get tags(): any {
        return this.resource.metadata.tags || [];
    }

    get description(): string {
        return this.resource.description || "";
    }

    get tdrFile(): any {
        return this._tdrFile;
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

    set workitem(workitems: string[]) {
        this.resource.metadata.workitem = workitems;
    }

    public addWorkItem(workitem: string) {
        if (this.resource.metadata.workitem) {
            this.resource.metadata.workitem.push(workitem);
        } else {
            this.resource.metadata.workitem = [workitem];
        }
    }

    set cost(cost: string) {
        this.resource.metadata.cost = cost;
    }

    set effort(effort: string) {
        this.resource.metadata.effort = effort;
    }

    set detectionPhase(detectionPhase: string) {
        this.resource.metadata.detectionPhase = detectionPhase;
    }

    set detectionMethod(detectionMethod: string) {
        this.resource.metadata.detectionMethod = detectionMethod;
    }

    set injectionPhase(injectionPhase: string) {
        this.resource.metadata.injectionPhase = injectionPhase;
    }

    set injectionQualifier(injectionQualifier: string) {
        this.resource.metadata.injectionQualifier = injectionQualifier;
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

    public addComment(comment: string[]) {
        if (this._discussion) {
            this._discussion.push(comment);
        } else {
            this._discussion = [comment];
        }
    }

    set tags(tags: string[]) {
        this.resource.metadata.tags = tags;
    }

    public addTag(tag: string) {
        if (this.resource.metadata.tags) {
            this.resource.metadata.tags.push(tag);
        } else {
            this.resource.metadata.tags = [tag];
        }
    }

    private getDiagnostic(): any {
        if (vscode.workspace.workspaceFolders !== undefined) {
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(this.startLine, this.startColumn, this.endLine, this.endColumn),
                this.title
            );

            diagnostic.source = this.type || "Technical Doc Record";

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
                case "hint":
                    diagnostic.severity = vscode.DiagnosticSeverity.Hint;
                    break;
                default:
                    diagnostic.severity = vscode.DiagnosticSeverity.Warning;
                    break;
            }
            return diagnostic;
        } else {
            return undefined;
        }
    }

    public raiseProblem() {
        const diagnostic = this.getDiagnostic();
        if (diagnostic) {
            if (vscode.workspace.workspaceFolders !== undefined) {
                const uri = vscode.Uri.file(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, this.file));
                const diagnostics = vscode.languages.createDiagnosticCollection('TechDocRecs');
                diagnostics.set(uri, [diagnostic]);
            }
        }
    }

    public removeProblem() {
        // TODO
    }

    public toString(): string {
        return "---" + os.EOL + yaml.dump(this.metadata) + "---" + os.EOL + this.description;
    }

    public fromString(mmd: string) {
        const parsedData = fm(mmd);

        this.metadata = parsedData.attributes;

        this.description = parsedData.body;
    }

    public init(title?: string) {
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
        this.description += "## Description" + os.EOL + os.EOL;      // What is the issue?
        this.description += "## Impedes" + os.EOL + os.EOL;          // What happens if we don't fix it?
        this.description += "## Costs" + os.EOL + os.EOL;            // What does it means in terms of costs if we don't fix it?
        this.description += "## Effort to fix" + os.EOL + os.EOL;    // How much will it cost to resolve?
        this.description += "## Solution(s)" + os.EOL + os.EOL;
        this.description += "## Decision" + os.EOL + os.EOL;
    }

    public persist(tdrPath: string): boolean {
        fs.mkdir(path.dirname(tdrPath), { recursive: true }, (err) => {
            if (err) {
                vscode.window.showErrorMessage("Error creating directory: " + path.dirname(tdrPath));
                return false;
            }

            fs.writeFile(tdrPath, this.toString(), (err) => {
                if (err) {
                    vscode.window.showErrorMessage("Error creating file: " + tdrPath);
                    return false;
                }
                vscode.window.showInformationMessage("Sucessfully created " + tdrPath + "!");
            });
        });
        return true;
    }
}

export class TechDocRecs extends Observable {
    private _tdrs: { [id: string]: TechDocRec; } = {};

    constructor(context: vscode.ExtensionContext) {

        super();

        const sidebar = new TechDocRecSidebar(context, this);

        // Register Listener for onDidChangeWorkspaceFolders event
        vscode.workspace.onDidChangeWorkspaceFolders(event => {
            this.getTechDocRecsInWorkspace();
        });

        context.subscriptions.push(vscode.commands.registerCommand('vscode-tdr.addExplorerTechDebt', async (selectedResourceUri: vscode.Uri) => {
            this.addExplorerTechDebt(selectedResourceUri);
        }));

        context.subscriptions.push(vscode.commands.registerCommand('vscode-tdr.addEditorTechDebt', async (selectedResourceUri: vscode.Uri) => {
            let editor = vscode.window.activeTextEditor;
            if (!editor) {
                return; // No active editor
            }
            let selection = editor.selection;
            if (selection.isEmpty) {
                let cursorPosition = editor.selection.active;
                this.addExplorerTechDebt(selectedResourceUri, cursorPosition.line, cursorPosition.character, cursorPosition.line, cursorPosition.character);
            } else {
                this.addExplorerTechDebt(selectedResourceUri, selection.start.line, selection.start.character, selection.end.line, selection.end.character);
            }
        }));

        // Register tdr for markdown
        // eslint-disable-next-line @typescript-eslint/naming-convention
        vscode.workspace.getConfiguration().update("files.associations", { "*.tdr": "markdown" }, false);

        // Register sidebar
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider("vscode-tdr-sidebar", sidebar)
        );

        // Let sidebar observe TDRs
        this.addObserver(sidebar);

        this.getTechDocRecsInWorkspace();
    }

    private registerTechDocRec(tdr: TechDocRec) {
        // Raise item in problem view
        tdr.raiseProblem();

        // Add to technical doc record array
        this._tdrs[tdr.id] = tdr;

        if(tdr.tdrFile) {
            // Register file watcher
            const fileWatcher = vscode.workspace.createFileSystemWatcher(tdr.tdrFile.fsPath);
            const tdrId = tdr.id;
    
            // Register a callback function for when the file is changed
            fileWatcher.onDidChange(async (uri) => {
                const td = await this.readTDR(uri);
                if(td) {
                    if(this._tdrs[tdrId]) {
                        this._tdrs[tdrId] = td;
                        this.notifyObservers(this._tdrs);
                    }
                }
            });
        } else {
            console.error("Undefined TDR file!");
        }

        // Inform observers
        this.notifyObservers(this._tdrs);
    }

    private async addExplorerTechDebt(uri: vscode.Uri, startLine?: number, startColumn?: number, endLine?: number, endColumn?: number) {

        var title = await vscode.window.showInputBox({
            prompt: 'Enter a title for the technical debt:',
            placeHolder: path.basename(uri.fsPath),
        });

        if (title && (vscode.workspace.workspaceFolders !== undefined)) {
            var tdFileName = title.replace(/\s+/g, '-');
            tdFileName = tdFileName.replace(/[^\w-]/gi, '') + ".tdr";

            const td = new TechDocRec();
            td.init(title);
            td.file = path.relative(vscode.workspace.workspaceFolders[0].uri.fsPath, uri.fsPath);

            const tdFilePath = path.join(path.dirname(uri.fsPath), ".tdr", tdFileName);

            // Set TDR URI
            td.tdrFile = vscode.Uri.file(tdFilePath);

            if (startLine) {
                td.startLine = startLine;
            }
            if (startColumn) {
                td.startColumn = startColumn;
            }
            if (endLine) {
                td.endLine = endLine;
            }
            if (endColumn) {
                td.endColumn = endColumn;
            }

            this.registerTechDocRec(td);

            td.persist(tdFilePath);
        }
    }

    private readTDR(uri: vscode.Uri): Promise<TechDocRec> {

        const filePath = uri.fsPath;

        return new Promise((resolve, reject) => {
            // Read the contents of the file
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    console.error(err);
                    reject(err);
                } else {
                    // Parse the TDR data
                    try {
                        const td = new TechDocRec();
                        td.fromString(data);
                        td.tdrFile = uri;
                        resolve(td);
                    } catch (err) {
                        console.error(err);
                        reject(err);
                    }
                }
            });
        });
    }

    private getTechDocRecsInWorkspace() {

        if (vscode.workspace.workspaceFolders !== undefined) {
            // Use the workspace root path to find all TDR files
            const files = vscode.workspace.findFiles('**/*.tdr', '**/node_modules/**', 1000);

            // Analyze each file
            files.then((uris) => {
                uris.forEach(async uri => {
                    const td = await this.readTDR(uri);
                    if(td) {
                        this.registerTechDocRec(td);
                    }
                });
            });
        } else {
            // Nothing to do
        }
    }

    get techDocRecs(): { [id: string]: TechDocRec; } {
        return this._tdrs;
    }
}

