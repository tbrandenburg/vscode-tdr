import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export { getAssetURI, getHTML }

/**
 * Get URI of file in resources.
 * @param {vscode.ExtensionContext} context
 * @param {string} filename
 * @returns {vscode.Uri}
 */
function getURI(context:vscode.ExtensionContext, filename:string): vscode.Uri {
  return vscode.Uri.file(
    path.join(context.extensionPath, 'resources', filename)
  );
}

/**
 * Get the webview-compliant URI for an asset.
 * @param {vscode.ExtensionContext} context
 * @param {vscode.WebviewView} view
 * @param {string} filename
 * @returns {vscode.Uri}
 */
function getAssetURI(context:vscode.ExtensionContext, webview:vscode.Webview, filename:string): vscode.Uri {
  return webview.asWebviewUri(getURI(context, filename));
}

/**
 * Get HTML from asset.
 * @param {vscode.ExtensionContext} context
 * @param {string} filename
 * @param {Map} placeholderValues
 * @returns {string} HTML
 */
function getHTML(context:vscode.ExtensionContext, filename:string, placeholderValues:Map<string, any>): string {
  const pathURI = getURI(context, filename).with({scheme: 'vscode-resource'});
  var html = fs.readFileSync(pathURI.fsPath,'utf8');

  placeholderValues.forEach((value:any, key:string) => {
    html = html.split(`{{${key}}}`).join(value);
  });

  return html;
}