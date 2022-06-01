import * as vscode from 'vscode';
import { Secp256k1HdWallet } from "@cosmjs/launchpad";
import { StdSignDoc } from "@cosmjs/amino";
import { Workspace } from '../models/Workspace';


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

	private sign(data: any) {
		const account = Workspace.GetSelectedAccount();
		if (!account) {
			vscode.window.showErrorMessage("No account selected");
		}
		else {
			Secp256k1HdWallet.fromMnemonic(account.mnemonic, {
				prefix: Workspace.GetWorkspaceChainConfig().addressPrefix,
			}).then(wallet => {
				const signDoc = this.makeSignDoc(
					account.address,
					data.value,
				);
				wallet.signAmino(account.address, signDoc).then(resp => {
					let output = "// Input: \n";
					output += data.value + "\n\n";
					output += "// Signed output: \n"
					output += JSON.stringify(resp.signature, null, 4);
					this.outputResponse(output);
				}).catch(err => {
					let output = this.getErrorOutput(data, err);
					this.outputResponse(output);
				})
			}).catch(err => {
				let output = this.getErrorOutput(data, err);
				this.outputResponse(output);
			});
		}
	}


	private getErrorOutput(data: any, err: any): string {
		let output = "// Input: \n";
		output += data.value + "\n\n";
		output += "// ⚠️ Signing failed \n\n";
		output += err;
		return output;
	}

	private outputResponse(output: string) {
		vscode.workspace.openTextDocument({
			language: "jsonc"
		}).then(doc => {
			vscode.window.showTextDocument(doc).then(editor => {
				editor.insertSnippet(new vscode.SnippetString(output));
			});
		});
	}

	private makeSignDoc(
		signer: string,
		data: string | Uint8Array,
	): StdSignDoc {
		if (typeof data === 'string') {
			data = Buffer.from(data).toString('base64');
		} else {
			data = Buffer.from(data).toString('base64');
		}
	
		return {
			chain_id: '',
			account_number: '0',
			sequence: '0',
			fee: {
				gas: '0',
				amount: [],
			},
			msgs: [
				{
					type: 'sign/MsgSignData',
					value: {
						signer,
						data,
					},
				},
			],
			memo: '',
		};
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
				
				<title>Sign Page</title>
			</head>
			<body>
				<textarea id="input-text"></textarea>
				<button id="exec-button">Sign</button>
				<script src="${scriptUri}"></script>
			</body>
			</html>`;
	}

}