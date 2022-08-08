import * as vscode from 'vscode';
import { Workspace } from '../helpers/Workspace';
import { Constants } from '../constants';
import { Account } from '../models/Account';
import { ResponseHandler } from '../helpers/ResponseHandler';
import { Cosmwasm } from '../helpers/Cosmwasm/API';


export class InitializeViewProvider implements vscode.WebviewViewProvider {

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
                        const account = Workspace.GetSelectedAccount();
                        if (!account) {
                            vscode.window.showErrorMessage("No account selected. Select an account from the Accounts view.");
                            return;
                        }
                        if (!data.value.codeid) {
                            vscode.window.showErrorMessage("CodeId is not specified");
                            return;
                        }
                        if (!data.value.label) {
                            vscode.window.showErrorMessage("No label provided for the contract");
                            return;
                        }
                        try {
                            JSON.parse(data.value.input);
                        } catch {
                            vscode.window.showErrorMessage("The input is not valid JSON");
                            return;
                        }
                        this.executeInitiate(data, account);
                        break;
                    }
            }
        });        
    }

    private executeInitiate(data: any, account: Account) {
        const req = JSON.parse(data.value.input);
        vscode.window.withProgress({
            location: { viewId: Constants.VIEWS_INITIALIZE },
            title: "Initializing the contract",
            cancellable: false
        }, (progress, token) => {
            token.onCancellationRequested(() => { });
            progress.report({ message: '' });
            return new Promise(async (resolve, reject) => {

                let codeId = Number(data.value.codeid);
                let label = data.value.label;

                try {
                    let res = await this.instantiateContract(account, codeId, req, label);
                    ResponseHandler.OutputSuccess(JSON.stringify(data.value, null, 4), JSON.stringify(res, null, 4), "Initialize");
                    if (data.value.import) {
                        await vscode.commands.executeCommand('cosmy-wasmy.addContract', res.contractAddress);
                    }
                    resolve(undefined);

                }
                catch (err: any) {
                    ResponseHandler.OutputError(JSON.stringify(data.value, null, 4), err, "Initialize");
                    reject(undefined);
                }
            });
        });
    }

    private async instantiateContract(account: Account, codeId: number, req: Record<string, unknown>, label: any) {
            let client = await Cosmwasm.GetSigningClient();
            let res = await client.instantiate(account.address, codeId, req, label, "auto", {
                admin: account.address,
            });
            return res;
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
                <input type="number" id="codeid-text" placeholder="CodeId"></input>
                <input type="text" id="label-text" placeholder="Contract Label"></input>
				<textarea id="input-text" placeholder="{'count': 100}"></textarea>
				<button id="exec-button">Initialize</button>
                <button id="exec-import-button" title="Initialize the contract and automatically import it to Cosmy Wasmy">Initialize + Import</button>
				<script>
                (function () {
                    const vscode = acquireVsCodeApi();
                
                    document.querySelector('#exec-button').addEventListener('click', () => {
                        const inputText = document.getElementById('input-text').value;
                        const codeId = document.getElementById('codeid-text').value;
                        const labelText = document.getElementById('label-text').value;
                        vscode.postMessage({ type: 'exec-text', value: {
                            codeid: codeId,
                            label: labelText,
                            input: inputText
                        }});
                    });

                    document.querySelector('#exec-import-button').addEventListener('click', () => {
                        const inputText = document.getElementById('input-text').value;
                        const codeId = document.getElementById('codeid-text').value;
                        const labelText = document.getElementById('label-text').value;
                        vscode.postMessage({ type: 'exec-text', value: {
                            codeid: codeId,
                            label: labelText,
                            input: inputText,
                            import: true
                        }});
                    });
                
                }());
                </script>
			</body>
			</html>`;
    }
}