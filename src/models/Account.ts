import * as vscode from 'vscode';
//import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { EthSecp256k1HdWallet } from '../helpers/Sign/ethsecp256k1hdwallet';
import { ExtData } from '../helpers/extensionData/extData';
import { Workspace } from '../helpers/workspace';
import { CosmwasmAPI } from '../helpers/cosmwasm/api';
import { stringToPath } from "@cosmjs/crypto";

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
		for (let account of accountData) {
			const wallet = await EthSecp256k1HdWallet.fromMnemonic(account.mnemonic, {
				prefix: global.workspaceChain.addressPrefix
			});
			const accounts = await wallet.getAccounts();
			account.address = accounts[0].address;
			try {
				account.balance = await CosmwasmAPI.GetBalance(account.address);
			}
			catch {
				account.balance = "NaN"; // lol but yea todo - when cant fetch balance, show that balance was not fetched. until then making it seem like js is being naughty 😈
			}
		}
		return accountData;
	}

	public static GetAccountsBasic(context: vscode.Memento): Account[] {
		return ExtData.GetExtensionData(context).accounts;
	}

	public static async AddAccount(context: vscode.Memento, account: Account) {
		try{
			const wallet = await EthSecp256k1HdWallet.fromMnemonic(account.mnemonic, {
				prefix: global.workspaceChain.addressPrefix
			}); 
			const temp = await wallet.getAccounts();
	
			const accounts = this.GetAccountsBasic(context);
			accounts.push(account);
			ExtData.SaveAccounts(context, accounts);
			return true;
		}
		catch{
			return false;
		}
	}

	public static DeleteAccount(context: vscode.Memento, account: Account) {
		let accounts = this.GetAccountsBasic(context).filter(a => a.label != account.label);
		ExtData.SaveAccounts(context, accounts);
	}

	public static AccountLabelExists(context: vscode.Memento, accountLabel: string): boolean {
		const accounts = this.GetAccountsBasic(context);
		return accounts.some(a => a.label === accountLabel);
	}

	public static AccountMnemonicExists(context: vscode.Memento, mnemonic: string): boolean {
		const accounts = this.GetAccountsBasic(context);
		return accounts.some(a => a.mnemonic === mnemonic);;
	}
}
