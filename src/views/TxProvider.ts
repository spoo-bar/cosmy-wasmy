import * as vscode from 'vscode';
import { Constants } from '../constants';
import { Executer } from '../helpers/cosmwasm/executer';


export class TxProvider implements vscode.WebviewViewProvider {

	constructor(
		private readonly _extensionUri: vscode.Uri,
		private readonly context: vscode.Memento,
	) { }

	resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken): void | Thenable<void> {
		webviewView.webview.options = {
			enableScripts: true,
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(data => {
			switch (data.type) {
				case 'exec-text':
					{
						new Executer(this.context, true).Execute(data.value, {viewId: Constants.VIEWS_EXECUTE});
						break;
					}
			}
		});
	}

	private _getHtmlForWebview(webview: vscode.Webview) {

		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" style-src ${webview.cspSource};">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">
				
				<title>Tx Page</title>
			</head>
			<body>
				<textarea id="input-text" placeholder="{'increment':{}}"></textarea>
				<button id="exec-button">Execute</button>
				<script>
					(function () {
						const vscode = acquireVsCodeApi();
						document.querySelector('#exec-button').addEventListener('click', () => {
							const input = document.getElementById('input-text').value;
							vscode.postMessage({ type: 'exec-text', value: input });
						});
					}());
				</script>
			</body>
			</html>`;
	}
}