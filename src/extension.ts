// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { Account } from './models/Account';
import { AccountDataProvider } from './views/AccountDataProvider';
import { ContractDataProvider } from './views/ContractDataProvider';
import { Contract } from './models/Contract';
import { Cosmwasm, CosmwasmAPI } from "./helpers/CosmwasmAPI";
import { ExtData } from './helpers/ExtData';
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
import { HistoryHandler } from './helpers/HistoryHandler';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	let chainSelected = vscode.window.createStatusBarItem(Constants.STATUSBAR_ID_SELECTED_CONFIG, vscode.StatusBarAlignment.Left);
	chainSelected.tooltip = "Selected Chain Config";
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
		Cosmwasm.CreateClientAsync();
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
	}

	function registerCommands() {
		registerAddAccountCmd();
		registerRequestFundsCmd();
		registerCopyAccountAddressCmd();
		registerCopyMnemonicCmd();
		registerDeleteAddressCmd();
		registerSelectAccountCmd();
		registerAddContractCmd();
		registerSelectContractCmd();
		registerDeleteContractCmd();
		registerResetDataCmd();
		registerReloadConfigCmd();
		registerBuildCmd();
		registerRunUnitTestsCmd();
		registerOptimizeContractCmd();
		registerGenerateSchemaCmd();
		registerSetUpDevEnvCmd();
		registerUploadContractCmd();
		registerQueryHistoryCmd();
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
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.addContract', () => {
			vscode.window.showInputBox({
				title: "Contract Address",
				placeHolder: "Cosmwasm contract address"
			}).then(contractAddr => {
				if (contractAddr) {
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
									reject(err)
								})
							});
						});
					}
					else {
						vscode.window.showErrorMessage("Contract has already been imported: " + contractAddr);
					}
				}
			});
		});
		context.subscriptions.push(disposable);
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
				loadChainConfig();
				vscode.window.showInformationMessage("Selected chain config has been reloaded.");
				const accounts = await Account.GetAccounts(context.globalState);
				accountViewProvider.refresh(accounts);
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
				vscode.window.showErrorMessage("Feature disabled: Cosmwasm Query History. In the settings, set `" + Constants.CONFIGURATION_QUERY_HISTORY + "` to a non-zero value.")
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

	try {
		loadChainConfig();
		await Cosmwasm.CreateClientAsync();

	}
	catch (error: any) {
		vscode.window.showErrorMessage(error.message);
		return;
	}

	contractViewProvider.refresh(Contract.GetContracts(context.globalState));
	accountViewProvider.refresh(await Account.GetAccounts(context.globalState));
}

// this method is called when your extension is deactivated
export function deactivate() {
	Cosmwasm.Client.disconnect();
}

