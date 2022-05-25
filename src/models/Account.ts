import * as vscode from 'vscode';
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";

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

	public static getAccounts(context: vscode.Memento): Account[] {
		const accountData = this.getAccountsBasic(context);
		accountData.forEach(async (account) => {
			const wallet = await DirectSecp256k1HdWallet.fromMnemonic(account.mnemonic, {
				prefix: "cosmos",
			});
			const accounts = await wallet.getAccounts();
			account.address = accounts[0].address;
		});
		return accountData;
	}

	public static getAccountsBasic(context: vscode.Memento): Account[] {
		const accountData = context.get<Account[]>("account");
		if (accountData) {
			return accountData;
		}
		return [];
	}

	public static addAccount(context: vscode.Memento, account: Account) {
		const accounts = this.getAccountsBasic(context);
		accounts.push(account);
		context.update("account", accounts);
	}

	public static deleteAccount(context: vscode.Memento, account: Account) {
		const accountData = this.getAccountsBasic(context);
		const newAccData = accountData.filter(acc => acc.label !== acc.label);
		context.update("account", newAccData);
	}

	public static deleteAllAccounts(context: vscode.Memento) {
		context.update("account", []);
	}
}
