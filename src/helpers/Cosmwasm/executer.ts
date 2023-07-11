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
            vscode.window.showErrorMessage(vscode.l10n.t("No contract selected. Select a contract in the Contracts view."));
            return;
        }
        try {
            JSON.parse(input);
        } catch {
            vscode.window.showErrorMessage(vscode.l10n.t("The input is not valid JSON"));
            return;
        }

        const query = JSON.parse(input);

        if (this.useHistoryHandler) {
            HistoryHandler.RecordAction(this.context, contract, Action.Query, input);
        }

        vscode.window.withProgress({
            location: location,
            title: vscode.l10n.t("Querying the contract - {label}", { label: contract.label }),
            cancellable: false
        }, async (progress, token) => {
            token.onCancellationRequested(() => { });
            progress.report({ message: '' });
            let response = await Cosmwasm.Query(contract.contractAddress, query);
            if (response.isSuccess) {
                return Promise.resolve();
            }
            else {
                return Promise.reject();
            }
        });
    }

    public Execute(value: any, location: vscode.ProgressLocation | { viewId: string }) {
        const account = Workspace.GetSelectedAccount();
        if (!account) {
            vscode.window.showErrorMessage(vscode.l10n.t("No account selected. Select an account from the Accounts view."));
            return;
        }
        const contract = Workspace.GetSelectedContract();
        if (!contract) {
            vscode.window.showErrorMessage(vscode.l10n.t("No contract selected. Select a contract in the Contracts view."));
            return;
        }
        try {
            JSON.parse(value.input);
        } catch {
            vscode.window.showErrorMessage(vscode.l10n.t("The input is not valid JSON"));
            return;
        }

        const req = JSON.parse(value.input);

        if (this.useHistoryHandler) {
            HistoryHandler.RecordAction(this.context, contract, Action.Tx, value);
        }

        vscode.window.withProgress({
            location: location,
            title: vscode.l10n.t("Executing msg on the contract - {label}", { label: contract.label }),
            cancellable: false
        }, async (progress, token) => {
            token.onCancellationRequested(() => { });
            progress.report({ message: '' });
            const tx = await Cosmwasm.Execute(account, contract.contractAddress, req, "Sent from cosmy-wasmy", value.funds);
            const url = global.workspaceChain.txExplorerLink;
            if (tx.isSuccess && url) {
                const explorerUrl = url.replace("${txHash}", tx.response.transactionHash);
                if (Workspace.GetOpenTxInSimpleBrowser()) {
                    vscode.commands.executeCommand("simpleBrowser.api.open", vscode.Uri.parse(explorerUrl));
                }
                else {
                    vscode.window.showInformationMessage(new vscode.MarkdownString(vscode.l10n.t("View transaction in explorer") + " - [" + tx.response.transactionHash + "](" + explorerUrl + ")", true).value);
                }
                return Promise.resolve();
            }
            else {
                return Promise.reject();
            }
        });
    }
}


