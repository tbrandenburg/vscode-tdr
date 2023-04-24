import * as vscode from 'vscode';
import * as utils from './utils';
import * as path from 'path';

import { TechDocRecs } from '../techdocrec';
import { Observer } from '../patterns/observer';

/**
 * Webview content provider for sidebar.
 * @implements {vscode.WebviewViewProvider}
 */
export class TechDocRecSidebar implements vscode.WebviewViewProvider, Observer {

  private webviewView?: vscode.WebviewView;

  /**
   * Constructor of the class.
   * @param {vscode.ExtensionContext}
   * @param {TechDocRecs}
   */
  constructor(private context: vscode.ExtensionContext, private tdrs: TechDocRecs) { }

  /**
   * More like initialization of the webview (when sidebar is opened initially)
   * @param {vscode.WebviewView}
   */
  public resolveWebviewView(webviewView: vscode.WebviewView) {

    const placeholderValues = new Map<string, any>();

    placeholderValues.set('reset.css', utils.getAssetURI(this.context, webviewView.webview, 'reset.css'));
    placeholderValues.set('vscode.css', utils.getAssetURI(this.context, webviewView.webview, 'vscode.css'));
    placeholderValues.set('sidebar.css', utils.getAssetURI(this.context, webviewView.webview, 'sidebar.css'));
    placeholderValues.set('csp.source', webviewView.webview.cspSource);
    placeholderValues.set('sidebar.js', utils.getAssetURI(this.context, webviewView.webview, 'sidebar.js'));
    placeholderValues.set('jquery.min.js', utils.getAssetURI(this.context, webviewView.webview, 'jquery/jquery.min.js'));
    placeholderValues.set('jquery-ui.min.js', utils.getAssetURI(this.context, webviewView.webview, 'jquery/jquery-ui.min.js'));
    if (vscode && vscode.window && vscode.window.activeColorTheme && vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark) {
      placeholderValues.set('jquery-ui.css', utils.getAssetURI(this.context, webviewView.webview, 'jquery/jquery-ui-dark.css'));
    } else {
      placeholderValues.set('jquery-ui.css', utils.getAssetURI(this.context, webviewView.webview, 'jquery/jquery-ui-light.css'));
    }

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };

    webviewView.webview.html = utils.getHTML(this.context, 'sidebar.html', placeholderValues);

    this.webviewView = webviewView;

    webviewView.webview.onDidReceiveMessage(async (data: any) => {
      switch (data.type) {
        // Update WebView e.g. for initialization
        case 'update': {
          if (this.webviewView) {
            this.webviewView.webview.postMessage({ type: 'tdrs', data: this.tdrs.techDocRecs });
          }
          break;
        }
        // User changed attributes of the technical doc record
        case 'onTDChange': {
          if (data.id && data.attribute && data.value) {
            if(vscode.workspace.workspaceFolders !== undefined) {

              // Update TDR's attributes
              this.tdrs.techDocRecs[data.id].setAttribute(data.attribute, data.value);

              // Request technical doc records to update based on UI change
              this.tdrs.update(data.id);

            }
          }
          break;
        }
        // User clicked on technical doc record
        case 'onTDClick': {
          if (data.id) {
            if(vscode.workspace.workspaceFolders !== undefined) {

              const tdrFile = this.tdrs.techDocRecs[data.id].tdrFile;

              if(tdrFile) {
                // Open editor and markdown
                vscode.window.showTextDocument(tdrFile, {
                  preview: false,
                  viewColumn: vscode.ViewColumn.One
                }).then(editor => {
                  vscode.commands.executeCommand('markdown.showPreviewToSide');
                });
              } else {
                vscode.window.showErrorMessage("No technical doc record found!");
              }
            }
          }
          break;
        }
        // User clicked on remove button
        case 'onTDRemove': {
          if (data.id) {
            this.tdrs.remove(data.id);
          }
          break;
        }
        // WebView sent an information
        case 'onInformation': {
          if (data.message) {
            vscode.window.showInformationMessage(data.message);
          }
          break;
        }
        // WebView sent an error
        case 'onError': {
          if (data.message) {
            console.log(data.message);
            vscode.window.showErrorMessage(data.message);
          }
          break;
        }
      }
    });

    this.webviewView.webview.postMessage({ type: 'tdrs', data: this.tdrs.techDocRecs });
  }

  // WebView has to update because observed technical doc record file has changed
  public update(data: any) {
    if (this.webviewView) {
      this.webviewView.webview.postMessage({ type: 'tdrs', data: data });
    }
  }

}