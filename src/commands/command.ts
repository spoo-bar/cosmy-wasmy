import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import * as vscode from 'vscode';
import AccountViewProvider from '../extension';
import { Account } from '../models/Account';

export class Commands {
    public static async Register(context: vscode.ExtensionContext) {
        this.registerAddAccountCmd(context);
		// registerRequestFundsCmd();
		// registerOpenInExplorerCmd();
		// registerCopyAccountAddressCmd();
		// registerCopyMnemonicCmd();
		// registerDeleteAddressCmd();
		// registerSelectAccountCmd();
		// registerAddContractCmd();
		// registerSelectContractCmd();
		// registerDeleteContractCmd();
		// registerUpdateContractAdminCmd();
		// registerClearContractAdminCmd();
		// registerAddContractCommentCmd();
		// registerResetDataCmd();
		// registerReloadConfigCmd();
		// registerBuildCmd();
		// registerRunUnitTestsCmd();
		// registerOptimizeContractCmd();
		// registerGenerateSchemaCmd();
		// registerSetUpDevEnvCmd();
		// registerUploadContractCmd();
		// registerQueryHistoryCmd();
		// registerExportDataCmd();
		// registerQueryCosmwasmCmd();
		// registerTxCosmwasmCmd();
    }

	private static registerAddAccountCmd(context: vscode.ExtensionContext) {
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
			AccountViewProvider.refresh(accounts);
		}
	}
 }