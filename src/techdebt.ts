import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as crypto from 'crypto';

const fm = require('front-matter');
const yaml = require('js-yaml');

import { TechDebtSidebar } from './webview/sidebar';

interface ITechDebtMetadata {
    id?: string;                 // Identifier of the technical debt
    title: string;               // Title of the technical debt
    author?: string;             // Author of the technical debt record
    date?: string;               // Date of the technical debt record
    owner?: string;              // Solution owner/Responsible
    status?: string;             // Such as new, in progress, closed, deferred
    resolution?: string;         // Such as solved, invalid, duplicate
    type?: string;               // Type of technical debt record, e.g. Technical Debt, TODO, FIXME etc.
    severity?: string;           // Such as minor, normal, major, critical, blocker (+warning, information, hint)

    /* Low:    <10%    it is rather unlikely this debt gets relevant in the project
     * Medium: 10-50%  medium likelihood the debt gets relevant
     * High:   >50%    it is very likely that this debt gets relevant in the project
     */
    priority?: string;

    file?: string;               // Location of technical debt
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

interface ITechDebt {
    metadata: ITechDebtMetadata;
    description?: string;
}

class TechDebt {
    private _td: ITechDebt = {
        metadata: {
            title: ""
        }
    };

    private _discussion: any[] = [];
    private _votes: string[] = [];

    constructor() {
        this.init();
    }

    get metadata(): ITechDebtMetadata {
        return this._td.metadata;
    }

    set metadata(techDebt: ITechDebtMetadata) {
        this.title = techDebt.title;
        if (techDebt.file) { this.file = techDebt.file; };
        if (techDebt.id) { this.id = techDebt.id; };
        if (techDebt.author) { this.author = techDebt.author; };
        if (techDebt.date) { this.date = techDebt.date; };
        if (techDebt.owner) { this.owner = techDebt.owner; };
        if (techDebt.status) { this.status = techDebt.status; };
        if (techDebt.resolution) { this.resolution = techDebt.resolution; };
        if (techDebt.type) { this.type = techDebt.type; };
        if (techDebt.severity) { this.severity = techDebt.severity; };
        if (techDebt.priority) { this.priority = techDebt.priority; };
        if (techDebt.startLine) { this.startLine = techDebt.startLine; };
        if (techDebt.startColumn) { this.startColumn = techDebt.startColumn; };
        if (techDebt.endLine) { this.endLine = techDebt.endLine; };
        if (techDebt.endColumn) { this.endColumn = techDebt.endColumn; };
        if (techDebt.workitem) { this.workitem = techDebt.workitem; };
        if (techDebt.cost) { this.cost = techDebt.cost; };
        if (techDebt.effort) { this.effort = techDebt.effort; };
        if (techDebt.detectionPhase) { this.detectionPhase = techDebt.detectionPhase; };
        if (techDebt.detectionMethod) { this.detectionMethod = techDebt.detectionMethod; };
        if (techDebt.injectionPhase) { this.injectionPhase = techDebt.injectionPhase; };
        if (techDebt.injectionQualifier) { this.injectionQualifier = techDebt.injectionQualifier; };
        if (techDebt.tags) { this.tags = techDebt.tags; };
    }

    get id(): string {
        return this._td.metadata.id || "";
    }

    get title(): string {
        return this._td.metadata.title;
    }

    get author(): string {
        return this._td.metadata.author || "";
    }

    get date(): string {
        return this._td.metadata.date || "";
    }

    get owner(): string {
        return this._td.metadata.owner || "";
    }

    get status(): string {
        return this._td.metadata.status || "";
    }

    get resolution(): string {
        return this._td.metadata.resolution || "";
    }

    get type(): string {
        return this._td.metadata.type || "";
    }

    get severity(): string {
        return this._td.metadata.severity || "";
    }

    get priority(): string {
        return this._td.metadata.priority || "";
    }

    get file(): string {
        return this._td.metadata.file || ".";
    }

    get startLine(): number {
        return this._td.metadata.startLine || 0;
    }

    get startColumn(): number {
        return this._td.metadata.startColumn || 0;
    }

    get endLine(): number {
        return this._td.metadata.endLine || 0;
    }

    get endColumn(): number {
        return this._td.metadata.endColumn || 0;
    }

    get workitem(): string[] {
        return this._td.metadata.workitem || [];
    }

    get cost(): string {
        return this._td.metadata.cost || "";
    }

    get effort(): string {
        return this._td.metadata.effort || "";
    }

    get detectionPhase(): string {
        return this._td.metadata.detectionPhase || "";
    }

    get detectionMethod(): string {
        return this._td.metadata.detectionMethod || "";
    }

    get injectionPhase(): string {
        return this._td.metadata.injectionPhase || "";
    }

    get injectionQualifier(): string {
        return this._td.metadata.injectionQualifier || "";
    }

    get votes(): string[] {
        return this._votes || [];
    }

    get discussion(): any[] {
        return this._discussion || [];
    }

    get tags(): any {
        return this._td.metadata.tags || [];
    }

    get description(): string {
        return this._td.description || "";
    }

    set id(id: string) {
        this._td.metadata.id = id;
    }

    set title(title: string) {
        this._td.metadata.title = title;
    }

    set author(author: string) {
        this._td.metadata.author = author;
    }

    set date(date: string) {
        this._td.metadata.date = date;
    }

    set owner(owner: string) {
        this._td.metadata.owner = owner;
    }

    set status(status: string) {
        this._td.metadata.status = status;
    }

    set resolution(resolution: string) {
        this._td.metadata.resolution = resolution;
    }

    set type(type: string) {
        this._td.metadata.type = type;
    }

    set severity(severity: string) {
        this._td.metadata.severity = severity;
    }

    set priority(priority: string) {
        this._td.metadata.priority = priority;
    }

    set file(file: string) {
        this._td.metadata.file = file;
    }

    set startLine(line: number) {
        this._td.metadata.startLine = line;
    }

    set startColumn(column: number) {
        this._td.metadata.startColumn = column;
    }

    set endLine(line: number) {
        this._td.metadata.endLine = line;
    }

    set endColumn(column: number) {
        this._td.metadata.endColumn = column;
    }

    set workitem(workitems: string[]) {
        this._td.metadata.workitem = workitems;
    }

    public addWorkItem(workitem: string) {
        if (this._td.metadata.workitem) {
            this._td.metadata.workitem.push(workitem);
        } else {
            this._td.metadata.workitem = [workitem];
        }
    }

    set cost(cost: string) {
        this._td.metadata.cost = cost;
    }

    set effort(effort: string) {
        this._td.metadata.effort = effort;
    }

    set detectionPhase(detectionPhase: string) {
        this._td.metadata.detectionPhase = detectionPhase;
    }

    set detectionMethod(detectionMethod: string) {
        this._td.metadata.detectionMethod = detectionMethod;
    }

    set injectionPhase(injectionPhase: string) {
        this._td.metadata.injectionPhase = injectionPhase;
    }

    set injectionQualifier(injectionQualifier: string) {
        this._td.metadata.injectionQualifier = injectionQualifier;
    }

    set votes(votes: string[]) {
        this._votes = votes;
    }

    set description(description: string) {
        this._td.description = description;
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

    public addComment(comment: string[]) {
        if (this._discussion) {
            this._discussion.push(comment);
        } else {
            this._discussion = [comment];
        }
    }

    set tags(tags: string[]) {
        this._td.metadata.tags = tags;
    }

    public addTag(tag: string) {
        if (this._td.metadata.tags) {
            this._td.metadata.tags.push(tag);
        } else {
            this._td.metadata.tags = [tag];
        }
    }

    private getDiagnostic(): any {
        if (vscode.workspace.workspaceFolders !== undefined) {
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(this.startLine, this.startColumn, this.endLine, this.endColumn),
                this.title
            );

            diagnostic.source = this.type || "Technical Debt";

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
                const diagnostics = vscode.languages.createDiagnosticCollection('TechDebts');
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

export class TechDebts {
    private _tds: { [id: string]: TechDebt; } = {};

    constructor(context: vscode.ExtensionContext) {

        const sidebar = new TechDebtSidebar(context);

        // Register Listener for onDidChangeWorkspaceFolders event
        vscode.workspace.onDidChangeWorkspaceFolders(event => {
            this.getTechDebtsInWorkspace();
        });

        context.subscriptions.push(vscode.commands.registerCommand('vscode-tdr.addExplorerTechDebt', async (selectedResourceUri: vscode.Uri) => {
            this.addTechDebt(selectedResourceUri);
        }));

        context.subscriptions.push(vscode.commands.registerCommand('vscode-tdr.addEditorTechDebt', async (selectedResourceUri: vscode.Uri) => {
            let editor = vscode.window.activeTextEditor;
            if (!editor) {
                return; // No active editor
            }
            let selection = editor.selection;
            if (selection.isEmpty) {
                let cursorPosition = editor.selection.active;
                this.addTechDebt(selectedResourceUri, cursorPosition.line, cursorPosition.character, cursorPosition.line, cursorPosition.character);
            } else {
                this.addTechDebt(selectedResourceUri, selection.start.line, selection.start.character, selection.end.line, selection.end.character);
            }
        }));

        // Register tdr for markdown
        vscode.workspace.getConfiguration().update("files.associations", {"*.tdr": "markdown"}, false);

        this.getTechDebtsInWorkspace();
    }

    private async addTechDebt(uri: vscode.Uri, startLine?: number, startColumn?: number, endLine?: number, endColumn?: number) {

        var title = await vscode.window.showInputBox({
            prompt: 'Enter a title for the technical debt:',
            placeHolder: path.basename(uri.fsPath),
        });

        if (title && (vscode.workspace.workspaceFolders !== undefined)) {
            var tdFileName = title.replace(/\s+/g, '-');
            tdFileName = tdFileName.replace(/[^\w-]/gi, '') + ".tdr";

            const tdFilePath = path.join(path.dirname(uri.fsPath), ".tdr", tdFileName);

            const td = new TechDebt();
            td.init(title);
            td.file = path.relative(vscode.workspace.workspaceFolders[0].uri.fsPath, uri.fsPath);
            if(startLine) {
                td.startLine = startLine;
            }
            if(startColumn) {
                td.startColumn = startColumn;
            }
            if(endLine) {
                td.endLine = endLine;
            }
            if(endColumn) {
                td.endColumn = endColumn;
            }
            td.raiseProblem();
            td.persist(tdFilePath);
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
                            const td = new TechDebt();
                            td.fromString(data);
                            td.raiseProblem();
                            this._tds[td.id] = td;
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

    get techDebts(): { [id: string]: TechDebt; } {
        return this._tds;
    }
}

