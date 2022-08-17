// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { Account } from './models/Account';
import { AccountDataProvider } from './views/AccountDataProvider';
import { ContractDataProvider } from './views/ContractDataProvider';
import { Contract } from './models/Contract';
import { Cosmwasm, CosmwasmAPI } from "./helpers/Cosmwasm/API";
import { ExtData } from './helpers/ExtensionData/ExtData';
import { SignProvider } from './views/SignProvider';
import { QueryProvider } from './views/QueryProvider';
import { TxProvider } from './views/TxProvider';
import { Workspace } from './helpers/Workspace';
import clipboard from 'clipboardy';
import { Constants } from './constants';
import { MigrateViewProvider } from './views/MigrateViewProvider';
import { CosmwasmTerminal } from './views/CosmwasmTerminal';
import { InitializeViewProvider } from './views/InitializeViewProvider';
import { CosmwasmHistoryView } from './views/CosmwasmHistoryView';
import { Executer } from './helpers/Cosmwasm/Executer';
import { TextEncoder } from 'util';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	let chainSelected = vscode.window.createStatusBarItem(Constants.STATUSBAR_ID_SELECTED_CONFIG, vscode.StatusBarAlignment.Left);
	chainSelected.tooltip = "Select a different Chain";
	chainSelected.command = "cosmy-wasmy.reloadConfig";
	refreshExtensionContext();

	const accountViewProvider = new AccountDataProvider();
	vscode.window.registerTreeDataProvider(Constants.VIEWS_ACCOUNT, accountViewProvider);

	const contractViewProvider = new ContractDataProvider();
	vscode.window.registerTreeDataProvider(Constants.VIEWS_CONTRACT, contractViewProvider);

	const signingViewProvider = new SignProvider(context.extensionUri);
	context.subscriptions.push(vscode.window.registerWebviewViewProvider(Constants.VIEWS_SIGN, signingViewProvider));

	const queryViewProvider = new QueryProvider(context.extensionUri, context.globalState);
	context.subscriptions.push(vscode.window.registerWebviewViewProvider(Constants.VIEWS_QUERY, queryViewProvider));

	const txViewProvider = new TxProvider(context.extensionUri, context.globalState);
	context.subscriptions.push(vscode.window.registerWebviewViewProvider(Constants.VIEWS_EXECUTE, txViewProvider));

	const migrateViewProvider = new MigrateViewProvider(context.extensionUri, context.globalState);
	context.subscriptions.push(vscode.window.registerWebviewViewProvider(Constants.VIEWS_MIGRATE, migrateViewProvider));

	const initializeViewProvider = new InitializeViewProvider(context.extensionUri);
	context.subscriptions.push(vscode.window.registerWebviewViewProvider(Constants.VIEWS_INITIALIZE, initializeViewProvider));


	let terminal = new CosmwasmTerminal();
	registerCommands();

	function loadChainConfig() {
		const config = Workspace.GetWorkspaceChainConfig();
		chainSelected.text = "$(plug)" + config.configName;
		chainSelected.show();
		refreshExtensionContext();
	}

	function refreshExtensionContext() {
		const config = Workspace.GetWorkspaceChainConfig();
		if (config.faucetEndpoint) {
			vscode.commands.executeCommand('setContext', 'showRequestFunds', true);
		}
		else {
			vscode.commands.executeCommand('setContext', 'showRequestFunds', false);
		}
		if (config.accountExplorerLink && config.accountExplorerLink.includes("${accountAddress}")) {
			vscode.commands.executeCommand('setContext', 'showOpenInExplorer', true);
		}
		else {
			vscode.commands.executeCommand('setContext', 'showOpenInExplorer', false);
		}
	}

	function registerCommands() {
		registerAddAccountCmd();
		registerRequestFundsCmd();
		registerOpenInExplorerCmd();
		registerCopyAccountAddressCmd();
		registerCopyMnemonicCmd();
		registerDeleteAddressCmd();
		registerSelectAccountCmd();
		registerAddContractCmd();
		registerSelectContractCmd();
		registerDeleteContractCmd();
		registerUpdateContractAdminCmd();
		registerClearContractAdminCmd();
		registerAddContractCommentCmd();
		registerResetDataCmd();
		registerReloadConfigCmd();
		registerBuildCmd();
		registerRunUnitTestsCmd();
		registerOptimizeContractCmd();
		registerGenerateSchemaCmd();
		registerSetUpDevEnvCmd();
		registerUploadContractCmd();
		registerQueryHistoryCmd();
		registerExportDataCmd();
		registerQueryCosmwasmCmd();
		registerTxCosmwasmCmd();
	}

	function registerAddAccountCmd() {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.addAccount', () => {
			vscode.window.showInputBox({
				title: "Account Label",
				value: "testAccount",
			}).then(accountLabel => {
				if (accountLabel) {
					if (!Account.AccountLabelExists(context.globalState, accountLabel)) {
						const options = ["Generate seed phrase for me (Recommended)", "I have a seed phrase"];
						vscode.window.showQuickPick(options).then(rr => {
							if (rr) {
								if (rr == "Generate seed phrase for me (Recommended)") {
									DirectSecp256k1HdWallet.generate(24).then(wallet => {
										const account = new Account(accountLabel, wallet.mnemonic)
										saveNewAccount(account);
									});
								}
								if (rr == "I have a seed phrase") {
									vscode.window.showInputBox({
										title: "Account Mnemonic",
										placeHolder: "Ensure this is not your main account seed phrase. This info is stored in plain text in vscode."
									}).then(mnemonic => {
										if (mnemonic) {
											const account = new Account(accountLabel, mnemonic)
											saveNewAccount(account);
										}
									})
								}
							}
						});
					}
					else {
						vscode.window.showErrorMessage("Account label \"" + accountLabel + "\" is already taken. Choose a new one.");
					}
				}
			})
		});

		context.subscriptions.push(disposable);

		async function saveNewAccount(account: Account) {
			Account.AddAccount(context.globalState, account);
			vscode.window.showInformationMessage("Added new account: " + account.label);
			const accounts = await Account.GetAccounts(context.globalState);
			accountViewProvider.refresh(accounts);
		}
	}

	function registerRequestFundsCmd() {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.requestFunds', async (item: Account) => {
			if (item.address) {
				if (Workspace.GetWorkspaceChainConfig().faucetEndpoint) {
					vscode.window.withProgress({
						location: {
							viewId: Constants.VIEWS_ACCOUNT
						},
						title: "Requesting funds from faucet",
						cancellable: false
					}, (progress, token) => {
						token.onCancellationRequested(() => { });
						progress.report({ message: '' });
						return new Promise(async (resolve, reject) => {
							try {
								await CosmwasmAPI.RequestFunds(item.address);
								vscode.window.showInformationMessage("Funds updated! 🤑🤑");
								var accounts = await Account.GetAccounts(context.globalState);
								accountViewProvider.refresh(accounts);
								resolve(undefined);
							}
							catch (err: any) {
								vscode.window.showErrorMessage("Woopsie! Could not add funds 😿 - " + err);
								reject(err);
							}
						});
					});
				}
				else {
					vscode.window.showErrorMessage("Faucet endpoint has not been set in the chain config settings");
				}
			}
		});
		context.subscriptions.push(disposable);
	}

	function registerOpenInExplorerCmd() {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.openInExplorer', (item: Account) => {
			const url = Workspace.GetWorkspaceChainConfig().accountExplorerLink;
			const explorerUrl = url.replace("${accountAddress}", item.address);
			vscode.env.openExternal(vscode.Uri.parse(explorerUrl));
		});
		context.subscriptions.push(disposable);
	}

	function registerCopyAccountAddressCmd() {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.copyAddress', (item: Account | Contract) => {
			let address = "";
			if ((item as Account).address) {
				address = (item as Account).address;
			}
			else if ((item as Contract).contractAddress) {
				address = (item as Contract).contractAddress;
			}
			if (address) {
				clipboard.write(address).then(() => {
					vscode.window.showInformationMessage("Copied to clipboard: " + address);
				});
			}
			else {
				vscode.window.showErrorMessage("Could not copy to clipboard.");
			}
		});
		context.subscriptions.push(disposable);
	}

	function registerCopyMnemonicCmd() {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.copyMnemonic', (item: Account) => {
			if (item.mnemonic) {
				clipboard.write(item.mnemonic).then(() => {
					vscode.window.showInformationMessage("Copied to clipboard: " + item.mnemonic);
				});
			}
			else {
				vscode.window.showErrorMessage("Could not copy to clipboard.");
			}
		});
		context.subscriptions.push(disposable);
	}

	function registerDeleteAddressCmd() {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.deleteAccount', (item: Account) => {
			vscode.window.showQuickPick(["Yes", "No"], {
				title: "Are you sure you want to delete the account " + item.label + " ?",
				placeHolder: "Are you sure you want to delete the account " + item.label + " ?",
			}).then(async resp => {
				if (resp && resp.toLowerCase() === "yes") {
					Account.DeleteAccount(context.globalState, item);
					var accounts = await Account.GetAccounts(context.globalState);
					accountViewProvider.refresh(accounts);
					vscode.window.showInformationMessage("Deleted account: " + item.label);
				}
			})
		});
		context.subscriptions.push(disposable);
	}

	function registerSelectAccountCmd() {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.selectAccount', (account: Account) => {
			Workspace.SetSelectedAccount(account);
		});
		context.subscriptions.push(disposable);
	}

	function registerAddContractCmd() {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.addContract', (contractAddr: string) => {
			if (contractAddr) {
				importContract(contractAddr);
			}
			else {
				vscode.window.showInputBox({
					title: "Contract Address",
					placeHolder: "Cosmwasm contract address"
				}).then(contractAddrInput => {
					if (contractAddrInput) {
						importContract(contractAddrInput);
					}
				});
			}
		});
		context.subscriptions.push(disposable);

		function importContract(contractAddr: string) {
			if (!Contract.ContractAddressExists(context.globalState, contractAddr)) {
				vscode.window.withProgress({
					location: vscode.ProgressLocation.Notification,
					title: "Fetching the details for the contract - " + contractAddr,
					cancellable: false
				}, (progress, token) => {
					token.onCancellationRequested(() => { });
					progress.report({ message: '' });
					return new Promise((resolve, reject) => {
						CosmwasmAPI.GetContract(contractAddr).then(contract => {
							Contract.AddContract(context.globalState, contract);
							vscode.window.showInformationMessage("Added new contract: " + contract.codeId + ": " + contract.label);
							const contracts = Contract.GetContracts(context.globalState);
							contractViewProvider.refresh(contracts);
							resolve(contract);
						}).catch(err => {
							vscode.window.showErrorMessage("Could not import contract: " + contractAddr + " - " + err);
							reject(err);
						});
					});
				});
			}
			else {
				vscode.window.showErrorMessage("Contract has already been imported: " + contractAddr);
			}
		}
	}

	function registerSelectContractCmd() {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.selectContract', (contract: Contract) => {
			Workspace.SetSelectedContract(contract);
		});
		context.subscriptions.push(disposable);
	}

	function registerDeleteContractCmd() {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.deleteContract', (item: Contract) => {
			vscode.window.showQuickPick(["Yes", "No"], {
				title: "Are you sure you want to delete the contract " + item.label + " ?",
				placeHolder: "Are you sure you want to delete the contract " + item.label + " ?",
			}).then(resp => {
				if (resp && resp.toLowerCase() === "yes") {
					Contract.DeleteContract(context.globalState, item)
					var contracts = Contract.GetContracts(context.globalState);
					contractViewProvider.refresh(contracts);
					vscode.window.showInformationMessage("Deleted contract: " + item.label);
				}
			})
		});
		context.subscriptions.push(disposable);
	}

	function registerUpdateContractAdminCmd() {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.updateContractAdmin', (contract: Contract) => {
			vscode.window.showInputBox({
				title: "New contract admin address",
				prompt: "New contract admin address"
			}).then(input => {
				if (input) {
					const account = Workspace.GetSelectedAccount();
					if (!account) {
						vscode.window.showErrorMessage("No account selected. Select an account from the Accounts view.");
						return;
					}
					vscode.window.withProgress({
						location: vscode.ProgressLocation.Notification,
						title: "Updating contract admin on the contract - " + contract.label,
						cancellable: false
					}, (progress, token) => {
						token.onCancellationRequested(() => { });
						progress.report({ message: '' });
						return new Promise(async (resolve, reject) => {
							await Cosmwasm.UpdateAdmin(account, contract, input, resolve, reject);
						});
					});
				}
			})
		});
		context.subscriptions.push(disposable);
	}

	function registerClearContractAdminCmd() {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.clearContractAdmin', (contract: Contract) => {
			const account = Workspace.GetSelectedAccount();
			if (!account) {
				vscode.window.showErrorMessage("No account selected. Select an account from the Accounts view.");
				return;
			}
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "Clearing contract admin on the contract - " + contract.label,
				cancellable: false
			}, (progress, token) => {
				token.onCancellationRequested(() => { });
				progress.report({ message: '' });
				return new Promise(async (resolve, reject) => {
					await Cosmwasm.ClearAdmin(account, contract, resolve, reject);
				});
			});
		});
		context.subscriptions.push(disposable);
	}

	function registerAddContractCommentCmd() {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.addComments', (contract: Contract) => {
			if (contract) {
				vscode.window.showInputBox({
					title: "Add comments/notes for the contract",
					prompt: "Comments/notes added here will show up as you hover on the contract in the sidebar. This is purely to help with development and is not stored on-chain in any way",
					value: contract.notes
				}).then(input => {
					if (input) {
						contract.notes = input;
						Contract.UpdateContract(context.globalState, contract);
						contractViewProvider.refresh(Contract.GetContracts(context.globalState));
						vscode.window.showInformationMessage("Stored notes/comments for " + contract.label);
					}
				});
			}
		});
		context.subscriptions.push(disposable);
	}

	function registerResetDataCmd() {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.resetData', () => {
			vscode.window.showQuickPick(["Yes", "No"], {
				title: "Are you sure you want to delete all data?",
				placeHolder: "Are you sure you want to delete all data?"
			}).then(resp => {
				if (resp && resp.toLowerCase() === "yes") {
					ExtData.ResetExtensionData(context.globalState);
					vscode.window.showInformationMessage('All cosmy wasmy data was reset!');
					var data = ExtData.GetExtensionData(context.globalState);
					accountViewProvider.refresh(data.accounts);
					contractViewProvider.refresh(data.contracts);
				}
			})
		});

		context.subscriptions.push(disposable);
	}

	function registerReloadConfigCmd() {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.reloadConfig', async () => {
			try {
				const chainConfigs = Workspace.GetChainConfigs();
				const chainPicks: vscode.QuickPickItem[] = [];
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
				vscode.window.showQuickPick(chainPicks).then(async select => {
					if (select) {
						Workspace.SetWorkspaceChainConfig(select.label);
						refreshExtensionContext();
						const accounts = await Account.GetAccounts(context.globalState);
						accountViewProvider.refresh(accounts);
						const contracts = Contract.GetContracts(context.globalState);
						contractViewProvider.refresh(contracts);

						chainSelected.text = "$(plug)" + select.label;
						chainSelected.show();
						vscode.window.showInformationMessage(select.label + " has been loaded.");
					}
				})
			}
			catch (error: any) {
				vscode.window.showErrorMessage(error.message);
			}
		});

		context.subscriptions.push(disposable);
	}

	function registerBuildCmd() {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.build', async () => {
			terminal.build();
		});

		context.subscriptions.push(disposable);
	}

	function registerRunUnitTestsCmd() {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.runUnitTests', async () => {
			terminal.unitTests();
		});

		context.subscriptions.push(disposable);
	}

	function registerOptimizeContractCmd() {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.optimizeContract', async () => {
			terminal.optimize();
		});

		context.subscriptions.push(disposable);
	}

	function registerGenerateSchemaCmd() {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.generateSchema', async () => {
			terminal.schema();
			const workspaceFolder = vscode.workspace.workspaceFolders;
			if (workspaceFolder && workspaceFolder.length > 0) {
				let settings: any = {};
				const settingsFile = vscode.Uri.joinPath(workspaceFolder[0].uri, ".vscode", "settings.json");
				vscode.workspace.openTextDocument(settingsFile).then((document) => {
					settings = JSON.parse(document.getText());
				});
				const schema = [{
					fileMatch: [
						"*.json"
					],
					url: "/schema/execute_msg.json"
				}, {
					fileMatch: [
						"*.json"
					],
					url: "/schema/query_msg.json"
				}];
				if (settings.json) {
					if (settings.json.schemas) {
						settings["json.schemas"].push(...schema);
					}
					else {
						settings["json.schemas"] = schema;
					}
				}
				else {
					settings["json.schemas"] = schema;
				}
				const ss = new TextEncoder().encode(JSON.stringify(settings, null, 4));
				vscode.workspace.fs.writeFile(settingsFile, ss);

			}
		});

		context.subscriptions.push(disposable);
	}

	function registerSetUpDevEnvCmd() {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.setupDevEnv', async () => {
			terminal.setupDevEnv();
		});

		context.subscriptions.push(disposable);
	}

	function registerUploadContractCmd() {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.upload', (item: vscode.Uri) => {
			if (item) {
				Contract.Upload(item)
			}
			else {
				vscode.window.showOpenDialog({
					canSelectFiles: true,
					canSelectFolders: false,
					canSelectMany: false,
					title: "title",
					openLabel: "label",
					filters: {
						'Cosmwasm Contract': ['wasm']
					}
				}).then(doc => {
					if (doc && doc.length > 0) {
						const wasmFile = doc[0];
						Contract.Upload(wasmFile);
					}
				})
			}
		});

		context.subscriptions.push(disposable);
	}

	function registerQueryHistoryCmd() {
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

	function registerExportDataCmd() {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.export', async () => {
			const data = ExtData.GetExtensionData(context.globalState);
			data.accounts = await Account.GetAccounts(context.globalState);
			vscode.workspace.openTextDocument({
				language: "jsonc"
			}).then(doc => {
				vscode.window.showTextDocument(doc).then(editor => {
					editor.insertSnippet(new vscode.SnippetString(JSON.stringify(data, null, 4)));
				});
			});
		});
		context.subscriptions.push(disposable);
	}

	function registerQueryCosmwasmCmd() {
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

	function registerTxCosmwasmCmd() {
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

	try {
		loadChainConfig();

	}
	catch (error: any) {
		vscode.window.showErrorMessage(error.message);
		return;
	}

	const rustLangExtension = vscode.extensions.getExtension('rust-lang.rust-analyzer');
	if (!rustLangExtension) {
		vscode.window.showWarningMessage(new vscode.MarkdownString("We recommend to install the [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer) extention while working with Rust on vscode.").value)
	}

	contractViewProvider.refresh(Contract.GetContracts(context.globalState));
	accountViewProvider.refresh(await Account.GetAccounts(context.globalState));
}

// this method is called when your extension is deactivated
export function deactivate() {
}

