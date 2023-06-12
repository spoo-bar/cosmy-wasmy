import * as vscode from 'vscode';
import { Constants } from '../constants';
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
		this.createNewCWNotebookCmd(context);
		this.encodeToBase64Cmd(context);
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
				const currentlySelectedText = vscode.l10n.t("currently selected")
				chainPicks.filter(c => c.label == global.workspaceChain.configName).forEach(c => c.description += " (" + currentlySelectedText + ") ")
				vscode.window.showQuickPick(chainPicks, {
					canPickMany: false,
					title: vscode.l10n.t("Select a new chain config"),
					placeHolder: global.workspaceChain.configName
				}).then(async select => {
					if (select) {
						vscode.window.withProgress({
							location: vscode.ProgressLocation.Notification,
							title: vscode.l10n.t("Loading chain - {label}", { label: select.label }),
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
							vscode.window.showInformationMessage(vscode.l10n.t("{label} has been loaded to the workspace.", { label: select.label }));
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
				vscode.window.showInformationMessage(vscode.l10n.t("Finished syncing accounts and chains from Beaker.toml"))
			}
		});
		context.subscriptions.push(disposable);
	}

	private static createNewCWNotebookCmd(context: vscode.ExtensionContext) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.createCwNotebook', async () => {
			let cells: vscode.NotebookCellData[] = getNotebookText();
			let data = new vscode.NotebookData(cells) 
			let doc = await vscode.workspace.openNotebookDocument(Constants.VIEWS_NOTEBOOK, data);
			await vscode.window.showNotebookDocument(doc)

			function getNotebookText() {
				let cells: vscode.NotebookCellData[] = [new vscode.NotebookCellData(vscode.NotebookCellKind.Markup, "## CW Notebook (Sample)", Constants.LANGUAGE_MARKDOWN)];
				cells.push(new vscode.NotebookCellData(vscode.NotebookCellKind.Markup, 'You can create a CW notebook with config pointing to a wasm binary and the schema file and this allows anyone with the notebook to play with the contract locally in a virtual machine.', Constants.LANGUAGE_MARKDOWN));
				cells.push(new vscode.NotebookCellData(vscode.NotebookCellKind.Code, '[config]\r\ncontract-url = \"https://github.com/spoo-bar/cosmy-wasmy/raw/ec4b29d02eddeb9b5abe54ca2785265815238987/docs/contract/cosmy_wasmy_test.wasm\" # the http link to the smart contract which is downloaded to be used in the vm\r\nschema-url = \"https://github.com/spoo-bar/cosmy-wasmy/raw/ec4b29d02eddeb9b5abe54ca2785265815238987/docs/contract/counter.json\" # the http link to the json schema file for the contract e.g counter.json. Without this, the notebook kernel will not know how to process the input', Constants.LANGUAGE_TOML));
				cells.push(new vscode.NotebookCellData(vscode.NotebookCellKind.Markup, 'You can add any *markdown* **formatted** text in the notebook. You can also add input `json` which is used to input to the smart contract.', Constants.LANGUAGE_MARKDOWN));
				cells.push(new vscode.NotebookCellData(vscode.NotebookCellKind.Markup, '#### Step 1\r\nInitialize the contract. To be able to query/exec the contraact, it needs to first be initialized in the vm', Constants.LANGUAGE_MARKDOWN));
				cells.push(new vscode.NotebookCellData(vscode.NotebookCellKind.Code, '{\r\n    \"count\": 10 \r\n}', Constants.LANGUAGE_JSON));
				cells.push(new vscode.NotebookCellData(vscode.NotebookCellKind.Markup, "#### Step 2 - Query", Constants.LANGUAGE_MARKDOWN));
				cells.push(new vscode.NotebookCellData(vscode.NotebookCellKind.Code, '{\r\n    \"get_count\": {}\r\n}', Constants.LANGUAGE_JSON));
				cells.push(new vscode.NotebookCellData(vscode.NotebookCellKind.Markup, "#### Step 3 - Play with the contract in the VM", Constants.LANGUAGE_MARKDOWN));
				cells.push(new vscode.NotebookCellData(vscode.NotebookCellKind.Code, '{\r\n    \"increment\": {}\r\n}', Constants.LANGUAGE_JSON));
				return cells;
			}
		});
		context.subscriptions.push(disposable);
	}

	private static encodeToBase64Cmd(context: vscode.ExtensionContext) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.encodeToBase64', (item: vscode.Uri) => {
			let activeTextEditor = vscode.window.activeTextEditor;
			if (activeTextEditor.document.uri.path != item.path) {
				vscode.window.showErrorMessage(vscode.l10n.t("Something went wrong in fetching the selected text. Please try again!"));
				return;
			}
			const selection = activeTextEditor.selection;
			activeTextEditor.edit(function(e) {
				const selectedText = activeTextEditor.document.getText(new vscode.Range(selection.start, selection.end));
				let b = Buffer.from(selectedText);
				e.replace(selection, b.toString("base64"));
			})
		});
		context.subscriptions.push(disposable);
	}
}