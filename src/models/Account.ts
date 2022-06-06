import * as vscode from 'vscode';
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { ExtData } from './ExtData';
import { Workspace } from './Workspace';
import { CosmwasmAPI } from './CosmwasmAPI';

export class Account extends vscode.TreeItem {
	label: string;
	mnemonic: string;
	address: string;
	balance: string;

	/**
	 *
	 */
	constructor(label: string, mnemonic: string) {
		super(label);
		this.label = label;
		this.mnemonic = mnemonic;
		this.address = "";
		this.balance = "";
	}

	public static async GetAccounts(context: vscode.Memento): Promise<Account[]> {
		const accountData = this.GetAccountsBasic(context);
		for(let account of accountData) {
			const wallet = await DirectSecp256k1HdWallet.fromMnemonic(account.mnemonic, {
				prefix: Workspace.GetWorkspaceChainConfig().addressPrefix,
			});
			const accounts = await wallet.getAccounts();
			account.address = accounts[0].address;
			account.balance = await CosmwasmAPI.GetBalance(account.address);
		}
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

    public static DeleteAccount(context: vscode.Memento, account: Account) {
        let accounts = this.GetAccountsBasic(context).filter(a => a.label != account.label);
		ExtData.SaveAccounts(context, accounts);
    }

	public static AccountLabelExists(context: vscode.Memento, accountLabel: string): boolean {
		const accounts = this.GetAccountsBasic(context);
		return accounts.some(a => a.label === accountLabel);
	}
}
