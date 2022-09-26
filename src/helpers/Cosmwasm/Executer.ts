import { isMultisigThresholdPubkey } from '@cosmjs/amino';
import { TextDecoder } from 'util';
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
            let response = await Cosmwasm.Query(contract.contractAddress, query);
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
            const tx = await Cosmwasm.Execute(account, contract.contractAddress, req);
            const url = global.workspaceChain.txExplorerLink;
            if (tx.isSuccess && url) {
                const explorerUrl = url.replace("${txHash}", tx.response.transactionHash);
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


export class SmartExecutor {
    
    // this func aint really all that smart tho
    public async SmartCall(contractAddress: string, input: any) {
        const call = Object.keys(input)[0];
        const workspaceFolder = vscode.workspace.workspaceFolders[0];
        const decoder = new TextDecoder();
        const account = Workspace.GetSelectedAccount();

        // Check if the call is a query
        const querySchema = vscode.Uri.joinPath(workspaceFolder.uri, "schema", "query_msg.json");
        const queryContent = decoder.decode(await vscode.workspace.fs.readFile(querySchema));
        const queries = JSON.parse(queryContent).oneOf.map(q => q.required[0]);
        if(queries.some(q => q == call)) {
            return await Cosmwasm.Query(contractAddress, input);
        }

        // Check if the call is a tx
        const executeSchema = vscode.Uri.joinPath(workspaceFolder.uri, "schema", "execute_msg.json");
        const executeContent = decoder.decode(await vscode.workspace.fs.readFile(executeSchema));
        const execs = JSON.parse(executeContent).oneOf.map(e => e.required[0]);
        if(execs.some(e => e == call)) {
            return await Cosmwasm.Execute(account, contractAddress, input);
        }

        // const instantiateSchema = vscode.Uri.joinPath(workspaceFolder.uri, "schema", "instantiate_msg.json");
        // const migrateSchema = vscode.Uri.joinPath(workspaceFolder.uri, "schema", "migrate_msg.json");
        
        return; 
    }
}