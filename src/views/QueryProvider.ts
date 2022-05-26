import * as vscode from 'vscode';
import {CosmWasmClient} from "@cosmjs/cosmwasm-stargate";
import { ExtData } from '../models/ExtData';
import { Workspace } from '../models/Workspace';


export class QueryProvider implements vscode.WebviewViewProvider {


	private _view?: vscode.WebviewView;

	
	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken): void | Thenable<void> {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(data => {
			switch (data.type) {
				case 'exec-text':
					{
						const account = Workspace.GetSelectedAccount();
						if(!account) {
							vscode.window.showErrorMessage("No account selected");
						}
						const contract = Workspace.GetSelectedContract();
						if(!contract) {
							vscode.window.showErrorMessage("No contract selected");
						}
						//todo progress bar
						else {
							CosmWasmClient.connect(Workspace.GetWorkspaceChainConfig().rpcEndpoint).then(client => {
								const query = JSON.parse(data.value);
								// todo check json parse fail
								client.queryContractSmart(contract.contractAddress, query).then(resp => {
									let output = "// Input: \n";
									output += JSON.stringify(query, null, 4) + "\n\n";
									output += "// Query Result \n\n";
									output += JSON.stringify(resp, null, 4);									
									vscode.workspace.openTextDocument({
										language: "jsonc"
									}).then(doc => {
										vscode.window.showTextDocument(doc).then(editor => {
											editor.insertSnippet(new vscode.SnippetString(output));
										})
									})
								}).catch(err => {
									let output = "// Input: \n";
									output += data.value + "\n\n";
									output += "// ⚠️ Query failed \n\n";
									output += err;
									vscode.workspace.openTextDocument().then(doc => {
										vscode.window.showTextDocument(doc).then(editor => {
											editor.insertSnippet(new vscode.SnippetString(output));
										})
									})
								})
							})
						}
					}
			}
		});
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

		// Do the same for the stylesheet.
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));

		// Use a nonce to only allow a specific script to be run.
		const nonce = "qwfpb";

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">
				
				<title>Query Page</title>
			</head>
			<body>
				<textarea id="input-text"></textarea>
				<button id="exec-button">Query</button>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}

}