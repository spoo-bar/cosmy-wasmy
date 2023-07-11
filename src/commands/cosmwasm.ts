import * as vscode from 'vscode';
import { Constants } from '../constants';
import { Executer } from '../helpers/cosmwasm/executer';
import { Workspace } from '../helpers/workspace';
import { CosmwasmHistoryView } from '../views/cosmwasmHistoryView';

export class CosmwasmCmds {
	public static async Register(context: vscode.ExtensionContext) {
		this.registerQueryHistoryCmd(context);
		this.registerQueryCosmwasmCmd(context);
		this.registerTxCosmwasmCmd(context);
	}
	private static registerQueryHistoryCmd(context: vscode.ExtensionContext) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.history', () => {
			if (Workspace.GetCosmwasmQueriesStored() == 0) {
				vscode.window.showErrorMessage(vscode.l10n.t("Feature disabled: Cosmwasm Query History. In the settings, set `{config}` to a non-zero value.", {
					config: Constants.CONFIGURATION_HISTORY_STORED
				}))
			}
			else {
				const panel = vscode.window.createWebviewPanel(
					'history', // Identifies the type of the webview. Used internally
					vscode.l10n.t('Cosmwasm History'), // Title of the panel displayed to the user
					vscode.ViewColumn.Active, 
					{
						enableScripts: true
					} 
				);
				panel.iconPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'icon.svg');
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
					const cosmwasmExecutor = new Executer(context.globalState, true);
					cosmwasmExecutor.Query(jsonInput, vscode.ProgressLocation.Notification);
				});
			}
			else {
				let activeFile = vscode.window.activeTextEditor;
				if (activeFile) {
					let jsonInput = activeFile.document.getText();
					const cosmwasmExecutor = new Executer(context.globalState, true);
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
					let jsonInput = {
						input: document.getText(),
						funds: "",
					};
					const cosmwasmExecutor = new Executer(context.globalState, true);
					cosmwasmExecutor.Execute(jsonInput, vscode.ProgressLocation.Notification);
				});
			}
			else {
				let activeFile = vscode.window.activeTextEditor;
				if (activeFile) {
					let jsonInput = activeFile.document.getText();
					const cosmwasmExecutor = new Executer(context.globalState, true);
					cosmwasmExecutor.Execute(jsonInput, vscode.ProgressLocation.Notification);
				}
			}
		});
		context.subscriptions.push(disposable);
	}
}