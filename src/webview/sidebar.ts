import * as vscode from 'vscode';
import * as utils from './utils';

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
  constructor(private context:vscode.ExtensionContext) {}

  /**
   * More like initialization of the webview.
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
        case 'tdsbInit': {
          if(this.webviewView != undefined) {
            this.webviewView.webview.postMessage({type: 'init', data: "Init data"});
          }
        }
        case 'onError': {
          if (!data.message) {
            return;
          }
          vscode.window.showErrorMessage(data.message);
          break;
        }
      }
    });
  }
}