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
    workitem?: string[];
    cost?: string;
    effort?: string;
    impedes?: string;
    tags?: string[];
}

class TechDebt {
    private _td: ITechDebt = {
        brief: "",
        file: "."
    };

    private _discussion: any[] = [];
    private _votes: string[] = [];

    constructor() {
        this.init("", ".");
    }

    get values(): ITechDebt {
        return this._td;
    }

    set values(techDebt: ITechDebt) {
        this.brief = techDebt.brief;
        this.file = techDebt.file;
        if (techDebt.id)          { this.id = techDebt.id; };
        if (techDebt.author)      { this.author = techDebt.author; };
        if (techDebt.date)        { this.date = techDebt.date; };
        if (techDebt.description) { this.description = techDebt.description; };
        if (techDebt.owner)       { this.owner = techDebt.owner; };
        if (techDebt.category)    { this.category = techDebt.category; };
        if (techDebt.severity)    { this.severity = techDebt.severity; };
        if (techDebt.priority)    { this.priority = techDebt.priority; };
        if (techDebt.line)        { this.line = techDebt.line; };
        if (techDebt.column)      { this.column = techDebt.column; };
        if (techDebt.workitem)    { this.workitem = techDebt.workitem; };
        if (techDebt.cost)        { this.cost = techDebt.cost; };
        if (techDebt.effort)      { this.effort = techDebt.effort; };
        if (techDebt.impedes)     { this.impedes = techDebt.impedes; };
        if (techDebt.tags)        { this.tags = techDebt.tags; };
    }

    get id(): string {
        return this._td.id || "";
    }

    get brief(): string {
        return this._td.brief;
    }

    get author(): string {
        return this._td.author || "";
    }

    get date(): string {
        return this._td.date || "";
    }

    get description(): string {
        return this._td.description || "";
    }

    get owner(): string {
        return this._td.owner || "";
    }

    get category(): string {
        return this._td.category || "";
    }

    get severity(): string {
        return this._td.severity || "";
    }

    get priority(): string {
        return this._td.priority || "";
    }

    get file(): string {
        return this._td.file;
    }

    get line(): number {
        return this._td.line || 0;
    }

    get column(): number {
        return this._td.column || 0;
    }

    get workitem(): string[] {
        return this._td.workitem || [];
    }

    get cost(): string {
        return this._td.cost || "";
    }

    get effort(): string {
        return this._td.effort || "";
    }

    get impedes(): string {
        return this._td.impedes || "";
    }

    get votes(): string[] {
        return this._votes || [];
    }

    get discussion(): any[] {
        return this._discussion || [];
    }

    get tags(): any {
        return this._td.tags || [];
    }

    set id(id: string) {
        this._td.id = id;
    }

    set brief(brief: string) {
        this._td.brief = brief;
    }

    set author(author: string) {
        this._td.author = author;
    }

    set date(date: string) {
        this._td.date = date;
    }

    set description(description: string) {
        this._td.description = description;
    }

    set owner(owner: string) {
        this._td.owner = owner;
    }

    set category(category: string) {
        this._td.category = category;
    }

    set severity(severity: string) {
        this._td.severity = severity;
    }

    set priority(priority: string) {
        this._td.priority = priority;
    }

    set file(file: string) {
        this._td.file = file;
    }

    set line(line: number) {
        this._td.line = line;
    }

    set column(column: number) {
        this._td.column = column;
    }

    set workitem(workitems: string[]) {
        this._td.workitem = workitems;
    }

    public addWorkItem(workitem: string) {
        if (this._td.workitem) {
            this._td.workitem.push(workitem);
        } else {
            this._td.workitem = [workitem];
        }
    }

    set cost(cost: string) {
        this._td.cost = cost;
    }

    set effort(effort: string) {
        this._td.effort = effort;
    }

    set impedes(impedes: string) {
        this._td.impedes = impedes;
    }

    set votes(votes: string[]) {
        this._votes = votes;
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
        this._td.tags = tags;
    }

    public addTag(tag: string) {
        if (this._td.tags) {
            this._td.tags.push(tag);
        } else {
            this._td.tags = [tag];
        }
    }

    private getDiagnostic(): any {
        if (vscode.workspace.workspaceFolders !== undefined) {
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(this.line, this.column, this.line, this.column),
                this.brief
            );
            switch (this.severity) {
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
        return JSON.stringify(this.values, null, 4);
    }

    public init(brief: string, file: string) {
        const currentDate = new Date();

        const day = currentDate.getDate().toString().padStart(2, "0");
        const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
        const year = currentDate.getFullYear().toString();

        const formattedDate = `${year}-${month}-${day}`;

        this.values = {
            id: "TDR_" + crypto.createHash('sha256').update(brief + currentDate).digest('hex').toUpperCase().substring(0, 8),
            brief: brief,
            author: os.userInfo().username,
            date: formattedDate,
            file: file
        };
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

        context.subscriptions.push(vscode.commands.registerCommand('vscode-tdr.addTechDebt', async (selectedResourceUri: vscode.Uri) => {
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

            const tdFilePath = path.join(path.dirname(uri.fsPath), ".tdr", tdFileName);

            const td = new TechDebt();
            td.init(brief, path.relative(vscode.workspace.workspaceFolders[0].uri.fsPath, uri.fsPath));
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
                            td.values = JSON.parse(data);
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

