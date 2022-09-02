import * as vscode from 'vscode';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import clipboard from 'clipboardy';
import { Constants } from '../constants';
import { CosmwasmAPI } from '../helpers/cosmwasm/api';
import { Workspace } from '../helpers/workspace';
import { Account } from '../models/account';
import { Contract } from '../models/contract';
import { AccountDataProvider } from '../views/accountDataProvider';

export class AccountCmds {
	public static async Register(context: vscode.ExtensionContext) {
		this.registerAddAccountCmd(context, accountViewProvider);
		this.registerRequestFundsCmd(context, accountViewProvider);
		this.registerOpenInExplorerCmd(context);
		this.registerCopyAccountAddressCmd(context);
		this.registerCopyMnemonicCmd(context);
		this.registerDeleteAddressCmd(context, accountViewProvider);
		this.registerSelectAccountCmd(context);
		this.registerRefreshAccountCmd(context);
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
			if (!Account.AccountMnemonicExists(context.globalState, account.mnemonic)) {
				Account.AddAccount(context.globalState, account);
				vscode.window.showInformationMessage("Added new account: " + account.label);
				const accounts = await Account.GetAccounts(context.globalState);
				accountViewProvider.refresh(accounts);
			}
			else {
				vscode.window.showErrorMessage(account.label + " - Account with given seed phrase is already imported.");
			}
		}
	}

	private static registerRequestFundsCmd(context: vscode.ExtensionContext, accountViewProvider: AccountDataProvider) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.requestFunds', async (item: Account) => {
			if (item.address) {
				if (global.workspaceChain.faucetEndpoint) {
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
			const url = global.workspaceChain.accountExplorerLink;
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

	private static registerRefreshAccountCmd(context: vscode.ExtensionContext) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.refreshAccount', async () => {
			vscode.window.withProgress({
				location: { viewId: Constants.VIEWS_ACCOUNT },
				title: "Refreshing account view",
				cancellable: false
			}, async (progress, token) => {
				token.onCancellationRequested(() => { });
				progress.report({ message: '' });
				const accounts = await Account.GetAccounts(context.globalState);
				accountViewProvider.refresh(accounts);
				return Promise.resolve();
			});
		});
		context.subscriptions.push(disposable);
	}
}