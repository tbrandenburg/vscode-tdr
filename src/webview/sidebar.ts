import * as vscode from 'vscode';
import * as utils from './utils';
import { TechDebts } from '../techdebt';

/**
 * Webview content provider for sidebar.
 * @implements {vscode.WebviewViewProvider}
 */
export class TechDebtSidebar implements vscode.WebviewViewProvider {
  webviewView?: vscode.WebviewView;

  /**
   * Constructor of the class.
   * @param {vscode.ExtensionContext}
   * @param {RegexHandler}
   */ 
  constructor(private context:vscode.ExtensionContext, private tdrs:TechDebts) {}

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
    
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };

    webviewView.webview.html = utils.getHTML(this.context, 'sidebar.html', placeholderValues);

    this.webviewView = webviewView;

    webviewView.webview.onDidReceiveMessage(async (data:any) => {
      switch (data.type) {
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

    const tdrData = this.tdrs.techDebts;

    this.webviewView.webview.postMessage({type: 'tdrs', data: tdrData});
  }
}