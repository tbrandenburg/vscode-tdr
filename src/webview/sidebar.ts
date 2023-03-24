import * as vscode from 'vscode';
import * as utils from './utils';
import * as path from 'path';

import { TechDebts } from '../techdebt';
import { Observer } from '../patterns/observer';

/**
 * Webview content provider for sidebar.
 * @implements {vscode.WebviewViewProvider}
 */
export class TechDebtSidebar implements vscode.WebviewViewProvider, Observer {

  private webviewView?: vscode.WebviewView;

  /**
   * Constructor of the class.
   * @param {vscode.ExtensionContext}
   * @param {TechDebts}
   */
  constructor(private context: vscode.ExtensionContext, private tdrs: TechDebts) { }

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
        case 'update': {
          if (this.webviewView) {
            this.webviewView.webview.postMessage({ type: 'tdrs', data: this.tdrs.techDebts });
          }
          break;
        }
        case 'onTDChange': {
          if (data.message) {
            if(vscode.workspace.workspaceFolders !== undefined) {

              // TODO: Change file from here

            }
          }
          break;
        }
        case 'onTDClick': {
          if (data.message) {
            if(vscode.workspace.workspaceFolders !== undefined) {

              const tdrFile = this.tdrs.techDebts[data.message].tdrFile;

              if(tdrFile) {
                // Open editor and markdown
                vscode.window.showTextDocument(tdrFile, {
                  preview: false,
                  viewColumn: vscode.ViewColumn.One
                }).then(editor => {
                  vscode.commands.executeCommand('markdown.showPreviewToSide');
                });
              } else {
                vscode.window.showErrorMessage("No technical debt record found!");
              }
            }
          }
          break;
        }
        case 'onInformation': {
          if (data.message) {
            vscode.window.showInformationMessage(data.message);
          }
          break;
        }
        case 'onError': {
          if (data.message) {
            console.log(data.message);
            vscode.window.showErrorMessage(data.message);
          }
          break;
        }
      }
    });

    this.webviewView.webview.postMessage({ type: 'tdrs', data: this.tdrs.techDebts });
  }

  public update(data: any) {
    if (this.webviewView) {
      this.webviewView.webview.postMessage({ type: 'tdrs', data: data });
    }
  }

}