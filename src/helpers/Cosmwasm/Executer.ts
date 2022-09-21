import { isMultisigThresholdPubkey } from '@cosmjs/amino';
import * as vscode from 'vscode';
import { Action, HistoryHandler } from '../extensionData/historyHandler';
import { Workspace } from "../workspace";
import { Cosmwasm } from './api';


export class Executer {

    private readonly captureInteractions: boolean = false;

    constructor(
        private readonly context: vscode.Memento,
        private readonly useHistoryHandler: boolean
    ) {
        this.captureInteractions = Workspace.GetRecordCW();
    }

    public Query(input: any, location: vscode.ProgressLocation | { viewId: string }) {
        const contract = Workspace.GetSelectedContract();
        if (!contract) {
            vscode.window.showErrorMessage("No contract selected. Select a contract in the Contracts view.");
            return;
        }
        try {
            JSON.parse(input);
        } catch {
            vscode.window.showErrorMessage("The input is not valid JSON");
            return;
        }

        const query = JSON.parse(input);

        if (this.useHistoryHandler) {
            HistoryHandler.RecordAction(this.context, contract, Action.Query, input);
        }

        vscode.window.withProgress({
            location: location,
            title: "Querying the contract - " + contract.label,
            cancellable: false
        }, async (progress, token) => {
            token.onCancellationRequested(() => { });
            progress.report({ message: '' });
            let response = await Cosmwasm.Query(contract, query);
            if (response.isSuccess) {
                return Promise.resolve();
            }
            else {
                return Promise.reject();
            }
        });
    }

    public Execute(input: any, location: vscode.ProgressLocation | { viewId: string }) {
        const account = Workspace.GetSelectedAccount();
        if (!account) {
            vscode.window.showErrorMessage("No account selected. Select an account from the Accounts view.");
            return;
        }
        const contract = Workspace.GetSelectedContract();
        if (!contract) {
            vscode.window.showErrorMessage("No contract selected. Select a contract in the Contracts view.");
            return;
        }
        try {
            JSON.parse(input);
        } catch {
            vscode.window.showErrorMessage("The input is not valid JSON");
            return;
        }

        const req = JSON.parse(input);

        if (this.useHistoryHandler) {
            HistoryHandler.RecordAction(this.context, contract, Action.Tx, input);
        }

        vscode.window.withProgress({
            location: location,
            title: "Executing msg on the contract - " + contract.label,
            cancellable: false
        }, async (progress, token) => {
            token.onCancellationRequested(() => { });
            progress.report({ message: '' });
            const tx = await Cosmwasm.Execute(account, contract, req);
            const url = global.workspaceChain.txExplorerLink;
            if (tx && url) {
                const explorerUrl = url.replace("${txHash}", tx);
                if (Workspace.GetOpenTxInSimpleBrowser()) {
                    vscode.commands.executeCommand("simpleBrowser.api.open", vscode.Uri.parse(explorerUrl));
                }
                else {
                    vscode.window.showInformationMessage(new vscode.MarkdownString("View transaction in explorer - [" + tx + "](" + explorerUrl + ")", true).value);
                }
                return Promise.resolve();
            }
            else {
                return Promise.reject();
            }
        });
    }

}

