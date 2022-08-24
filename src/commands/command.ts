import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import clipboard from 'clipboardy';
import { TextEncoder } from 'util';
import * as vscode from 'vscode';
import { Constants } from '../constants';
import { Cosmwasm, CosmwasmAPI } from '../helpers/Cosmwasm/API';
import { Executer } from '../helpers/Cosmwasm/Executer';
import { ExtData } from '../helpers/ExtensionData/ExtData';
import { Workspace } from '../helpers/Workspace';
import { Account } from '../models/Account';
import { Contract } from '../models/Contract';
import { AccountDataProvider } from '../views/AccountDataProvider';
import { ContractDataProvider } from '../views/ContractDataProvider';
import { CosmwasmHistoryView } from '../views/CosmwasmHistoryView';
import { CosmwasmTerminal } from '../views/CosmwasmTerminal';
import { Utils } from '../views/utils';

export class Commands {
	public static async Register(context: vscode.ExtensionContext) {
		global.accountViewProvider = new AccountDataProvider();
		global.contractViewProvider = new ContractDataProvider();
		let terminal = new CosmwasmTerminal();

		this.registerAddAccountCmd(context, accountViewProvider);
		this.registerRequestFundsCmd(context, accountViewProvider);
		this.registerOpenInExplorerCmd(context);
		this.registerCopyAccountAddressCmd(context);
		this.registerCopyMnemonicCmd(context);
		this.registerDeleteAddressCmd(context, accountViewProvider);
		this.registerSelectAccountCmd(context);
		this.registerAddContractCmd(context, contractViewProvider);
		this.registerSelectContractCmd(context);
		this.registerDeleteContractCmd(context, contractViewProvider);
		this.registerUpdateContractAdminCmd(context);
		this.registerClearContractAdminCmd(context);
		this.registerAddContractCommentCmd(context, contractViewProvider);
		this.registerResetDataCmd(context, accountViewProvider, contractViewProvider);
		this.registerReloadConfigCmd(context, accountViewProvider, contractViewProvider);
		this.registerBuildCmd(context, terminal);
		this.registerRunUnitTestsCmd(context, terminal);
		this.registerOptimizeContractCmd(context, terminal);
		this.registerGenerateSchemaCmd(context, terminal);
		this.registerSetUpDevEnvCmd(context, terminal);
		this.registerUploadContractCmd(context);
		this.registerQueryHistoryCmd(context);
		this.registerExportDataCmd(context);
		this.registerQueryCosmwasmCmd(context);
		this.registerTxCosmwasmCmd(context);
	}

	private static registerAddAccountCmd(context: vscode.ExtensionContext, accountViewProvider: AccountDataProvider) {
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

	private static registerRequestFundsCmd(context: vscode.ExtensionContext, accountViewProvider: AccountDataProvider) {
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

	private static registerOpenInExplorerCmd(context: vscode.ExtensionContext) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.openInExplorer', (item: Account) => {
			const url = Workspace.GetWorkspaceChainConfig().accountExplorerLink;
			const explorerUrl = url.replace("${accountAddress}", item.address);
			vscode.env.openExternal(vscode.Uri.parse(explorerUrl));
		});
		context.subscriptions.push(disposable);
	}

	private static registerCopyAccountAddressCmd(context: vscode.ExtensionContext) {
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

	private static registerCopyMnemonicCmd(context: vscode.ExtensionContext) {
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

	private static registerDeleteAddressCmd(context: vscode.ExtensionContext, accountViewProvider: AccountDataProvider) {
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

	private static registerSelectAccountCmd(context: vscode.ExtensionContext) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.selectAccount', (account: Account) => {
			Workspace.SetSelectedAccount(account);
		});
		context.subscriptions.push(disposable);
	}

	private static registerAddContractCmd(context: vscode.ExtensionContext, contractViewProvider: ContractDataProvider) {
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

	private static registerSelectContractCmd(context: vscode.ExtensionContext) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.selectContract', (contract: Contract) => {
			Workspace.SetSelectedContract(contract);
		});
		context.subscriptions.push(disposable);
	}

	private static registerDeleteContractCmd(context: vscode.ExtensionContext, contractViewProvider: ContractDataProvider) {
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

	private static registerUpdateContractAdminCmd(context: vscode.ExtensionContext) {
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

	private static registerClearContractAdminCmd(context: vscode.ExtensionContext) {
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

	private static registerAddContractCommentCmd(context: vscode.ExtensionContext, contractViewProvider: ContractDataProvider) {
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

	private static registerResetDataCmd(context: vscode.ExtensionContext, accountViewProvider: AccountDataProvider, contractViewProvider: ContractDataProvider) {
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
				chainPicks.filter(c => c.label == Workspace.GetWorkspaceChainConfig().configName).forEach(c => c.description = " (currently selected) ")
				vscode.window.showQuickPick(chainPicks, {
					canPickMany: false,			
					title: "Select a new chain config",
					placeHolder: Workspace.GetWorkspaceChainConfig().configName	
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

	private static registerBuildCmd(context: vscode.ExtensionContext, terminal: CosmwasmTerminal) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.build', async () => {
			terminal.build();
		});

		context.subscriptions.push(disposable);
	}

	private static registerRunUnitTestsCmd(context: vscode.ExtensionContext, terminal: CosmwasmTerminal) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.runUnitTests', async () => {
			terminal.unitTests();
		});

		context.subscriptions.push(disposable);
	}

	private static registerOptimizeContractCmd(context: vscode.ExtensionContext, terminal: CosmwasmTerminal) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.optimizeContract', async () => {
			terminal.optimize();
		});

		context.subscriptions.push(disposable);
	}

	private static registerGenerateSchemaCmd(context: vscode.ExtensionContext, terminal: CosmwasmTerminal) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.generateSchema', async () => {
			terminal.schema();
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
			Workspace.SetWorkspaceSchemaAutoComplete(schema);
		});

		context.subscriptions.push(disposable);
	}

	private static registerSetUpDevEnvCmd(context: vscode.ExtensionContext, terminal: CosmwasmTerminal) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.setupDevEnv', async () => {
			terminal.setupDevEnv();
		});

		context.subscriptions.push(disposable);
	}

	private static registerUploadContractCmd(context: vscode.ExtensionContext) {
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

	private static registerExportDataCmd(context: vscode.ExtensionContext) {
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