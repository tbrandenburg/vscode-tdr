import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

const fm = require('front-matter');
const yaml = require('js-yaml');

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

export class TechDocRec {
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
                        diagnostic.severity = vscode.DiagnosticSeverity.Information;
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

        if (parsedData && this._tdrFile) {
            //this.metadata = parsedData.attributes;
            this.metadata = { ...this.metadata, ...parsedData.attributes };

            // Guarantuee a given title
            if (!this.title || this.title === "") {
                this.title = path.basename(this._tdrFile.fsPath, path.extname(this._tdrFile.fsPath));
            }

            this.description = parsedData.body;
        } else {
            throw new Error("Could not parse file!");
        }
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