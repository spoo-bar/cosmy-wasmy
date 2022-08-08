import * as vscode from 'vscode';
import { Workspace } from "../Workspace";
import { Action, HistoryHandler } from '../ExtensionData/HistoryHandler';
import { Cosmwasm } from './API';


export class Executer {

    constructor(
        private readonly context: vscode.Memento
    ) { }

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
        HistoryHandler.RecordAction(this.context, contract, Action.Query, input);
        vscode.window.withProgress({
            location: location,
            title: "Querying the contract - " + contract.label,
            cancellable: false
        }, (progress, token) => {
            token.onCancellationRequested(() => { });
            progress.report({ message: '' });
            return new Promise(async (resolve, reject) => {
                await Cosmwasm.Query(contract, query, resolve, reject);
            });
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

		HistoryHandler.RecordAction(this.context, contract, Action.Tx, input);
		vscode.window.withProgress({
			location: location,
			title: "Executing msg on the contract - " + contract.label,
			cancellable: false
		}, (progress, token) => {
			token.onCancellationRequested(() => { });
			progress.report({ message: '' });
			return new Promise(async (resolve, reject) => {
				await Cosmwasm.Execute(account, contract, req, resolve, reject);
			});
		});
    }

}

