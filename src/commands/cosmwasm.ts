import * as vscode from 'vscode';
import { Constants } from '../constants';
import { Executer } from '../helpers/Cosmwasm/Executer';
import { Workspace } from '../helpers/Workspace';
import { CosmwasmHistoryView } from '../views/CosmwasmHistoryView';

export class CosmwasmCmds {
    public static async Register(context: vscode.ExtensionContext) {
        this.registerQueryHistoryCmd(context);
        this.registerQueryCosmwasmCmd(context);
		this.registerTxCosmwasmCmd(context);
    }
    private static registerQueryHistoryCmd(context: vscode.ExtensionContext) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.history', () => {
			if (Workspace.GetCosmwasmQueriesStored() == 0) {
				vscode.window.showErrorMessage("Feature disabled: Cosmwasm Query History. In the settings, set `" + Constants.CONFIGURATION_HISTORY_STORED + "` to a non-zero value.")
			}
			else {
				const panel = vscode.window.createWebviewPanel(
					'history', // Identifies the type of the webview. Used internally
					'Cosmwasm History', // Title of the panel displayed to the user
					vscode.ViewColumn.Active, // Editor column to show the new webview panel in.
					{
						enableScripts: true
					} // Webview options. More on these later.
				);
				let view = new CosmwasmHistoryView(context.globalState);
				view.getWebviewContent(context.extensionUri, panel.webview);
			}
		});
		context.subscriptions.push(disposable);
	}

    private static registerQueryCosmwasmCmd(context: vscode.ExtensionContext) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.queryCosmwasm', (jsonFile: vscode.Uri) => {
			if (jsonFile) {
				vscode.workspace.openTextDocument(jsonFile).then((document) => {
					let jsonInput = document.getText();
					const cosmwasmExecutor = new Executer(context.globalState);
					cosmwasmExecutor.Query(jsonInput, vscode.ProgressLocation.Notification);
				});
			}
			else {
				let activeFile = vscode.window.activeTextEditor;
				if (activeFile) {
					let jsonInput = activeFile.document.getText();
					const cosmwasmExecutor = new Executer(context.globalState);
					cosmwasmExecutor.Query(jsonInput, vscode.ProgressLocation.Notification);
				}
			}
		});
		context.subscriptions.push(disposable);
	}

	private static registerTxCosmwasmCmd(context: vscode.ExtensionContext) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.execCosmwasm', (jsonFile: vscode.Uri) => {
			if (jsonFile) {
				vscode.workspace.openTextDocument(jsonFile).then((document) => {
					let jsonInput = document.getText();
					const cosmwasmExecutor = new Executer(context.globalState);
					cosmwasmExecutor.Execute(jsonInput, vscode.ProgressLocation.Notification);
				});
			}
			else {
				let activeFile = vscode.window.activeTextEditor;
				if (activeFile) {
					let jsonInput = activeFile.document.getText();
					const cosmwasmExecutor = new Executer(context.globalState);
					cosmwasmExecutor.Execute(jsonInput, vscode.ProgressLocation.Notification);
				}
			}
		});
		context.subscriptions.push(disposable);
	}
}