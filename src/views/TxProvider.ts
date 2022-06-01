import * as vscode from 'vscode';
import {
	SigningCosmWasmClient,
} from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet, OfflineSigner } from "@cosmjs/proto-signing";
import { GasPrice } from '@cosmjs/stargate';
import { Workspace } from '../models/Workspace';


export class TxProvider implements vscode.WebviewViewProvider {

	constructor(
		private readonly _extensionUri: vscode.Uri,
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
						executeTx(data);
						break;
					}
			}
		});

		function executeTx(data: any) {
			const account = Workspace.GetSelectedAccount();
			if (!account) {
				vscode.window.showErrorMessage("No account selected");
			}
			const contract = Workspace.GetSelectedContract();
			if (!contract) {
				vscode.window.showErrorMessage("No contract selected");
			}
			try {
				JSON.parse(data.value);
			} catch {
				vscode.window.showErrorMessage("The input is not valid JSON");
				return;
			}
			const req = JSON.parse(data.value);

			vscode.window.withProgress({
				location: {
					viewId: "execute"
				},
				title: "Querying the contract - " + contract.label,
				cancellable: false
			}, (progress, token) => {
				token.onCancellationRequested(() => { });
				progress.report({ message: '' });
				return new Promise((resolve, reject) => {
					DirectSecp256k1HdWallet.fromMnemonic(account.mnemonic, {
						prefix: Workspace.GetWorkspaceChainConfig().addressPrefix,
					}).then(signer => {
						SigningCosmWasmClient.connectWithSigner(
							Workspace.GetWorkspaceChainConfig().rpcEndpoint,
							signer, {
							gasPrice: GasPrice.fromString("0.025ujunox")
						}).then(client => {
							client.execute(account.address, contract.contractAddress, req, "auto").then(res => {
								let output = "// Input: \n";
								output += JSON.stringify(req, null, 4) + "\n\n";
								output += "// Tx Result \n\n";
								output += JSON.stringify(res, null, 4);
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
						})
					}).catch(err => {
						let output = getErrorOutput(data, err);
						outputResponse(output);
						reject(output);
					})
				})
			});
		}

		function getErrorOutput(data: any, err: any): string {
			let output = "// Input: \n";
			output += data.value + "\n\n";
			output += "// ⚠️ Tx failed \n\n";
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
				
				<title>Tx Page</title>
			</head>
			<body>
				<textarea id="input-text"></textarea>
				<button id="exec-button">Execute</button>
				<script src="${scriptUri}"></script>
			</body>
			</html>`;
	}

}