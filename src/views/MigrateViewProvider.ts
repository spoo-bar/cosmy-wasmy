import * as vscode from 'vscode';
import { Workspace } from '../helpers/workspace';
import { Constants } from '../constants';
import { ResponseHandler } from '../helpers/responseHandler';
import { Cosmwasm } from '../helpers/cosmwasm/api';
import { Account } from '../models/account';
import { Contract } from '../models/contract';


export class MigrateViewProvider implements vscode.WebviewViewProvider {

	constructor(
		private readonly _extensionUri: vscode.Uri,
		private readonly _context: vscode.Memento,
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
							vscode.window.showErrorMessage(vscode.l10n.t("No account selected. Select an account from the Accounts view."));
						}
						const contract = Workspace.GetSelectedContract();
						if (!contract) {
							vscode.window.showErrorMessage(vscode.l10n.t("No contract selected. Select a contract in the Contracts view."));
						}
						try {
							JSON.parse(data.value.input);
						} catch {
							vscode.window.showErrorMessage(vscode.l10n.t("The input is not valid JSON"));
							return;
						}
						this.executeMigrate(data, contract, account, this._context);
						break;
					}
			}
		});
	}

	private executeMigrate(data: any, contract: Contract, account: Account, context: vscode.Memento) {
		const req = data.value;
		vscode.window.withProgress({
			location: { viewId: Constants.VIEWS_MIGRATE },
			title: vscode.l10n.t("Migrating the contract - {label}", { label: contract.label }),
			cancellable: false
		}, (progress, token) => {
			token.onCancellationRequested(() => { });
			progress.report({ message: '' });
			return new Promise(async (resolve, reject) => {
				try {
					let client = await Cosmwasm.GetSigningClient();
					let newCodeID = Number(req.newCodeId)
					let res = await client.migrate(account.address, contract.contractAddress, newCodeID, JSON.parse(req.input), "auto");
					ResponseHandler.OutputSuccess(JSON.stringify(req, null, 4), JSON.stringify(res, null, 4), "Migrate");
					updateContactCodeID(newCodeID);
					resolve(undefined);
				}
				catch (err: any) {
					ResponseHandler.OutputError(JSON.stringify(req, null, 4), err, "Migrate");
					reject(undefined);
				}

				function updateContactCodeID(newCodeID: number) {
					contract.codeId = newCodeID;
					Contract.UpdateContractCodeID(context, contract);
					const contracts = Contract.GetContracts(context);
					contractViewProvider.refresh(contracts);
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
				<input type="number" id="codeid-text" placeholder="Code ID"></input>
				<textarea id="input-text" placeholder="{'payout':{}}"></textarea>
				<button id="exec-button">${vscode.l10n.t("Migrate")}</button>
				<script>
					(function () {
						const vscode = acquireVsCodeApi();
						document.querySelector('#exec-button').addEventListener('click', () => {
							const newCodeId = document.getElementById('codeid-text').value;
							const input = document.getElementById('input-text').value;
							vscode.postMessage({ type: 'exec-text', value: {
								input: input,
								newCodeId: newCodeId
							} });
						});
					}());
				</script>
			</body>
			</html>`;
	}
}