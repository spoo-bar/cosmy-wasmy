import * as vscode from 'vscode';
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { GasPrice } from '@cosmjs/stargate';
import { Workspace } from '../helpers/Workspace';
import { Constants } from '../constants';
import { Account } from '../models/Account';
import { ResponseHandler } from '../helpers/ResponseHandler';


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
                        executeMigrate(data);
                        break;
                    }
            }
        });

        function executeMigrate(data: any) {
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
            const req = JSON.parse(data.value.input);

            vscode.window.withProgress({
                location: { viewId: Constants.VIEWS_INITIALIZE },
                title: "Initializing the contract",
                cancellable: false
            }, (progress, token) => {
                token.onCancellationRequested(() => { });
                progress.report({ message: '' });
                return new Promise(async (resolve, reject) => {
                    
                    let codeId = data.value.codeid;
                    let label = data.value.label;

                    try {
                        let res = await instantiateContract(account, codeId, req, label);
                        ResponseHandler.OutputSuccess(JSON.stringify(data.value, null, 4), JSON.stringify(res, null, 4), "Initialize");
                        resolve(undefined);

                    }
                    catch (err: any) {
                        ResponseHandler.OutputError(JSON.stringify(data.value, null, 4), err, "Initialize");
                        reject(undefined);
                    }
                })
            });
        }

        async function instantiateContract(account: Account, codeId: any, req: any, label: any) {
            let signer = await DirectSecp256k1HdWallet.fromMnemonic(account.mnemonic, {
                prefix: Workspace.GetWorkspaceChainConfig().addressPrefix,
            });
            let gasPrice = Workspace.GetWorkspaceChainConfig().defaultGasPrice + Workspace.GetWorkspaceChainConfig().chainDenom;
            let client = await SigningCosmWasmClient.connectWithSigner(
                Workspace.GetWorkspaceChainConfig().rpcEndpoint,
                signer, {
                gasPrice: GasPrice.fromString(gasPrice)
            });
            let res = await client.instantiate(account.address, codeId, req, label, "auto", {
                admin: account.address,
            });
            return res;
        }
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
                
                }());
                </script>
			</body>
			</html>`;
    }
}