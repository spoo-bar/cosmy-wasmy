import * as vscode from 'vscode';
import { Workspace } from '../helpers/Workspace';
import { Account } from '../models/Account';
import { Contract } from '../models/Contract';
import { AccountDataProvider } from '../views/AccountDataProvider';
import { ContractDataProvider } from '../views/ContractDataProvider';
import { Utils } from '../views/utils';
import { AccountCmds } from './account';
import { ContractCmds } from './contract';
import { TerminalCmds } from './terminal';
import { WorkspaceDataCmds } from './workspacedata';

export class Commands {
	public static async Register(context: vscode.ExtensionContext) {
		global.accountViewProvider = new AccountDataProvider();
		global.contractViewProvider = new ContractDataProvider();

		AccountCmds.Register(context);
		ContractCmds.Register(context);
		TerminalCmds.Register(context);	
		WorkspaceDataCmds.Register(context);

		this.registerReloadConfigCmd(context, accountViewProvider, contractViewProvider);			
	}

	private static registerReloadConfigCmd(context: vscode.ExtensionContext, accountViewProvider: AccountDataProvider, contractViewProvider: ContractDataProvider) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.reloadConfig', async () => {
			try {
				const chainConfigs = Workspace.GetChainConfigs();
				let chainPicks: vscode.QuickPickItem[] = [];
				chainPicks.push({
					label: "Localnet",
					kind: vscode.QuickPickItemKind.Separator
				})
				chainConfigs.filter(c => c.chainEnvironment == "localnet").forEach(c => chainPicks.push({
					label: c.configName,
					detail: c.chainId
				}));
				chainPicks.push({
					label: "Testnet",
					kind: vscode.QuickPickItemKind.Separator
				})
				chainConfigs.filter(c => c.chainEnvironment == "testnet").forEach(c => chainPicks.push({
					label: c.configName,
					detail: c.chainId
				}));
				chainPicks.push({
					label: "Mainnet",
					kind: vscode.QuickPickItemKind.Separator
				})
				chainConfigs.filter(c => c.chainEnvironment == "mainnet").forEach(c => chainPicks.push({
					label: c.configName,
					detail: c.chainId
				}));
				chainPicks.filter(c => c.label == global.workspaceChain.configName).forEach(c => c.description = " (currently selected) ")
				vscode.window.showQuickPick(chainPicks, {
					canPickMany: false,
					title: "Select a new chain config",
					placeHolder: global.workspaceChain.configName
				}).then(async select => {
					if (select) {
						vscode.window.withProgress({
							location: vscode.ProgressLocation.Notification,
							title: "Loading chain - " + select.label,
							cancellable: false
						}, async (progress, token) => {
							token.onCancellationRequested(() => { });
							progress.report({ message: '' });

							Workspace.SetWorkspaceChainConfig(select.label);
							Utils.RefreshExtensionContext();

							const accounts = await Account.GetAccounts(context.globalState);
							accountViewProvider.refresh(accounts);

							const contracts = Contract.GetContracts(context.globalState);
							contractViewProvider.refresh(contracts);

							Utils.UpdateConnectedChainStatusItem();
							vscode.window.showInformationMessage(select.label + " has been loaded to the workspace.");
						});
					}
				})
			}
			catch (error: any) {
				vscode.window.showErrorMessage(error.message);
			}
		});

		context.subscriptions.push(disposable);
	}
}