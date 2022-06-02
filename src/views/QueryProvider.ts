import * as vscode from 'vscode';
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { Workspace } from '../models/Workspace';
import { Constants } from '../constants';


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
						const contract = Workspace.GetSelectedContract();
						if (!contract) {
							vscode.window.showErrorMessage("No contract selected. Select a contract in the Contracts view.");
						}
						else {
							try {
								JSON.parse(data.value);
							} catch {
								vscode.window.showErrorMessage("The input is not valid JSON");
								return;
							}
							const query = JSON.parse(data.value);

							vscode.window.withProgress({
								location: {
									viewId: Constants.VIEWS_QUERY
								},
								title: "Querying the contract - " + contract.label,
								cancellable: false
							}, (progress, token) => {
								token.onCancellationRequested(() => { });
								progress.report({ message: '' });
								return new Promise((resolve, reject) => {

									CosmWasmClient.connect(Workspace.GetWorkspaceChainConfig().rpcEndpoint).then(client => {

										client.queryContractSmart(contract.contractAddress, query).then(resp => {
											let output = "// Input: \n";
											output += JSON.stringify(query, null, 4) + "\n\n";
											output += "// Query Result \n\n";
											output += JSON.stringify(resp, null, 4);
											outputResponse(output);
											resolve(output);
										}).catch(err => {
											let output = getErrorOutput(data, err);
											outputResponse(output);
											reject(output);
										})
									}).catch(err => {
										let output = getErrorOutput(data, err);
										outputResponse(output);
										reject(output);
									});
								});
							});
						}
					}
			}
		});

		function getErrorOutput(data: any, err: any): string {
			let output = "// Input: \n";
			output += data.value + "\n\n";
			output += "// ⚠️ Query failed \n\n";
			output += err;
			return output;
		}

		function outputResponse(output: string) {
			vscode.workspace.openTextDocument({
				language: "jsonc"
			}).then(doc => {
				vscode.window.showTextDocument(doc).then(editor => {
					editor.insertSnippet(new vscode.SnippetString(output));
				});
			});
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

		// Do the same for the stylesheet.
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
				
				<title>Query Page</title>
			</head>
			<body>
				<textarea id="input-text"></textarea>
				<button id="exec-button">Query</button>
				<script src="${scriptUri}"></script>
			</body>
			</html>`;
	}

}