import * as vscode from 'vscode';
import { Workspace } from '../helpers/workspace';
import { Constants } from '../constants';
import { Account } from '../models/account';
import { ResponseHandler } from '../helpers/responseHandler';
import { Cosmwasm } from '../helpers/cosmwasm/api';
import { Utils } from './utils';
import { Coin } from '@cosmjs/amino';


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
                            vscode.window.showErrorMessage(vscode.l10n.t("No account selected. Select an account from the Accounts view."));
                            return;
                        }
                        if (!data.value.codeid) {
                            vscode.window.showErrorMessage(vscode.l10n.t("CodeId is not specified"));
                            return;
                        }
                        let admin = data.value.admin;
                        if (admin && admin.indexOf("0x") !== 0 && admin.indexOf(global.workspaceChain.addressPrefix) !== 0) {
                            vscode.window.showErrorMessage(vscode.l10n.t("Admin is not a valid address"));
                            return;
                        }
                        if (!data.value.label) {
                            vscode.window.showErrorMessage(vscode.l10n.t("No label provided for the contract"));
                            return;
                        }
                        try {
                            JSON.parse(data.value.input);
                        } catch {
                            vscode.window.showErrorMessage(vscode.l10n.t("The input is not valid JSON"));
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
            title: vscode.l10n.t("Initializing the contract"),
            cancellable: false
        }, (progress, token) => {
            token.onCancellationRequested(() => { });
            progress.report({ message: '' });
            return new Promise(async (resolve, reject) => {

                let codeId = Number(data.value.codeid);
                let admin = data.value.admin;
                let label = data.value.label;

                try {
                    let funds = Utils.ParseCoins(data.value.funds);
                    let res = await this.instantiateContract(account, codeId, req, label, funds, admin);
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

    private async instantiateContract(account: Account, codeId: number, req: Record<string, unknown>, label: any, funds: Coin[],  admin: any) {
        let client = await Cosmwasm.GetSigningClient();
        let res = await client.instantiate(account.address, codeId, req, label, "auto", {
            admin: admin,
            funds: funds,
            memo: "Initialized from cosmy-wasmy"
        });
        return res;
    }

    private _getHtmlForWebview(webview: vscode.Webview) {

        const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
        const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));

        const denom = global.workspaceChain.chainDenom;

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
                <input type="text" id="admin-text" placeholder="Contract Admin Address"></input>
                <input id="funds-text" placeholder="10${denom}"></input>
				<textarea id="input-text" placeholder="{'count': 100}"></textarea>
				<button id="exec-button">${vscode.l10n.t("Initialize")}</button>
                <!-- <button id="exec-import-button" title="Initialize the contract and automatically import it to Cosmy Wasmy">${vscode.l10n.t("Initialize")} + ${vscode.l10n.t("Import")}</button> -->
				<script>
                (function () {
                    const vscode = acquireVsCodeApi();
                
                    document.querySelector('#exec-button').addEventListener('click', () => {
                        const inputText = document.getElementById('input-text').value;
                        const codeId = document.getElementById('codeid-text').value;
                        const labelText = document.getElementById('label-text').value;
                        const adminText = document.getElementById('admin-text').value;
                        const funds = document.getElementById('funds-text').value;
                        vscode.postMessage({ type: 'exec-text', value: {
                            codeid: codeId,
                            label: labelText,
                            admin: adminText,
                            input: inputText,
                            funds: funds
                        }});
                    });

                    document.querySelector('#exec-import-button').addEventListener('click', () => {
                        const inputText = document.getElementById('input-text').value;
                        const codeId = document.getElementById('codeid-text').value;
                        const labelText = document.getElementById('label-text').value;
                        const adminText = document.getElementById('admin-text').value;
                        const funds = document.getElementById('funds-text').value;
                        vscode.postMessage({ type: 'exec-text', value: {
                            codeid: codeId,
                            label: labelText,
                            admin: adminText,
                            input: inputText,
                            funds: funds,
                            import: true
                        }});
                    });
                
                }());
                </script>
			</body>
			</html>`;
    }
}