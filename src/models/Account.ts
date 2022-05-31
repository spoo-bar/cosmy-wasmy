import * as vscode from 'vscode';
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { ExtData } from './ExtData';
import { Workspace } from './Workspace';

export class Account extends vscode.TreeItem {
	label: string;
	mnemonic: string;
	address: string;

	/**
	 *
	 */
	constructor(label: string, mnemonic: string) {
		super(label);
		this.label = label;
		this.mnemonic = mnemonic;
		this.address = "";
	}

	public static GetAccounts(context: vscode.Memento): Account[] {
		const accountData = this.GetAccountsBasic(context);
		accountData.forEach(async (account) => {
			const wallet = await DirectSecp256k1HdWallet.fromMnemonic(account.mnemonic, {
				prefix: Workspace.GetWorkspaceChainConfig().addressPrefix,
			});
			const accounts = await wallet.getAccounts();
			account.address = accounts[0].address;
		});
		return accountData;
	}

	public static GetAccountsBasic(context: vscode.Memento): Account[] {
		return ExtData.GetExtensionData(context).accounts;
	}

	public static AddAccount(context: vscode.Memento, account: Account) {
		const accounts = this.GetAccountsBasic(context);
		accounts.push(account);
		ExtData.SaveAccounts(context, accounts);
	}
}
