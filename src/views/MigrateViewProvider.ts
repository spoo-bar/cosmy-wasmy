import * as vscode from 'vscode';
import { Workspace } from '../helpers/Workspace';
import { Constants } from '../constants';
import { ResponseHandler } from '../helpers/ResponseHandler';
import { Cosmwasm } from '../helpers/Cosmwasm/API';
import { Account } from '../models/Account';
import { Contract } from '../models/Contract';
import { HistoryHandler } from '../helpers/ExtensionData/HistoryHandler';


export class MigrateViewProvider implements vscode.WebviewViewProvider {

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
						const account = Workspace.GetSelectedAccount();
						if (!account) {
							vscode.window.showErrorMessage("No account selected. Select an account from the Accounts view.");
						}
						const contract = Workspace.GetSelectedContract();
						if (!contract) {
							vscode.window.showErrorMessage("No contract selected. Select a contract in the Contracts view.");
						}
						try {
							JSON.parse(data.value);
						} catch {
							vscode.window.showErrorMessage("The input is not valid JSON");
							return;
						}
						this.executeMigrate(data, contract, account);
						break;
					}
			}
		});
	}

	private executeMigrate(data: any, contract: Contract, account: Account) {
		const req = JSON.parse(data.value);
		vscode.window.withProgress({
			location: { viewId: Constants.VIEWS_MIGRATE },
			title: "Migrating the contract - " + contract.label,
			cancellable: false
		}, (progress, token) => {
			token.onCancellationRequested(() => { });
			progress.report({ message: '' });
			return new Promise(async (resolve, reject) => {
				try {
					let client = await Cosmwasm.GetSigningClient();
					let res = await client.migrate(account.address, contract.contractAddress, contract.codeId, req, "auto");
					ResponseHandler.OutputSuccess(JSON.stringify(req, null, 4), JSON.stringify(res, null, 4), "Migrate");
					resolve(undefined);
				}
				catch (err: any) {
					ResponseHandler.OutputError(JSON.stringify(req, null, 4), err, "Migrate");
					reject(undefined);
				}
			});
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
				<textarea id="input-text" placeholder="{'payout':{}}"></textarea>
				<button id="exec-button">Migrate</button>
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