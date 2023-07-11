import * as vscode from 'vscode';
import { WrapWallet } from '../helpers/sign/wrapwallet';
import { StdSignDoc } from "@cosmjs/amino";
import { Workspace } from '../helpers/workspace';
import { ResponseHandler } from '../helpers/responseHandler';

export class SignProvider implements vscode.WebviewViewProvider {

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
						this.sign(data);
						break;
					}
			}
		});
	}

	private async sign(data: any) {
		const account = Workspace.GetSelectedAccount();
		if (!account) {
			vscode.window.showErrorMessage(vscode.l10n.t("No account selected. Select an account from the Accounts view."));
			return;
		}
		try {
			let wallet = await WrapWallet.fromMnemonic(global.workspaceChain.signType, account.mnemonic, {
				prefix: global.workspaceChain.addressPrefix,
			});
			const signDoc = this.makeSignDoc(account.address, data.value);
			let response = await wallet.signAmino(account.address, signDoc);
			ResponseHandler.OutputSuccess(data.value, JSON.stringify(response.signature, null, 4), "Signing")
		}
		catch (err: any) {
			ResponseHandler.OutputError(data.value, err, "Signing");
		}
	}

	private makeSignDoc(signer: string, data: string | Uint8Array): StdSignDoc {
		if (typeof data === 'string') {
			data = Buffer.from(data).toString('base64');
		} else {
			data = Buffer.from(data).toString('base64');
		}

		return {
			chain_id: global.workspaceChain.chainId,
			account_number: '0', sequence: '0',
			fee: { gas: '0', amount: [] },
			msgs: [
				{
					type: 'sign/MsgSignData',
					value: { signer, data },
				},
			],
			memo: '',
		};
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
				
				<title>Sign Page</title>
			</head>
			<body>
				<textarea id="input-text" placeholder="{'cosmy':'wasmy'}"></textarea>
				<button id="exec-button">${vscode.l10n.t("Sign")}</button>
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