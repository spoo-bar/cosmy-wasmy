import * as vscode from 'vscode';
import { Workspace } from '../helpers/workspace';
import { Account } from '../models/account';
import { Contract } from '../models/contract';
import { AccountDataProvider } from '../views/accountDataProvider';
import { ContractDataProvider } from '../views/contractDataProvider';
import { Utils } from '../views/utils';
import { AccountCmds } from './account';
import { ContractCmds } from './contract';
import { CosmwasmCmds } from './cosmwasm';
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
		CosmwasmCmds.Register(context);

		this.registerReloadConfigCmd(context, accountViewProvider, contractViewProvider);	
		this.syncBeakerTomlCmd(context);
		//this.registerRecordCWCmd(context);		
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
					detail: c.chainId,
					description: ""
				}));
				chainPicks.push({
					label: "Testnet",
					kind: vscode.QuickPickItemKind.Separator
				})
				chainConfigs.filter(c => c.chainEnvironment == "testnet").forEach(c => chainPicks.push({
					label: c.configName,
					detail: c.chainId,
					description: ""
				}));
				chainPicks.push({
					label: "Imported from Beaker",
					kind: vscode.QuickPickItemKind.Separator
				})
				chainConfigs.filter(c => c.chainEnvironment == "beaker").forEach(c => chainPicks.push({
					label: c.configName,
					detail: c.chainId,
					description: "$(beaker)"
				}));
				chainPicks.push({
					label: "Mainnet",
					kind: vscode.QuickPickItemKind.Separator
				})
				chainConfigs.filter(c => c.chainEnvironment == "mainnet").forEach(c => chainPicks.push({
					label: c.configName,
					detail: c.chainId,
					description: ""
				}));
				chainPicks.filter(c => c.label == global.workspaceChain.configName).forEach(c => c.description += " (currently selected) ")
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

	private static registerRecordCWCmd(context: vscode.ExtensionContext) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.recordCW', () => {
			Workspace.ToggleRecordCW();
			Utils.ShowRecordStatusItem();
		});
		context.subscriptions.push(disposable);
	}

	private static syncBeakerTomlCmd(context: vscode.ExtensionContext) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.beakerTomlSync', async (item: vscode.Uri) => {
			if (item) {
				await Utils.BeakerSync(item, context);
				vscode.window.showInformationMessage("Finished syncing accounts and chains from Beaker.toml")
			}
		});
		context.subscriptions.push(disposable);
	}
}