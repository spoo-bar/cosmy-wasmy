import * as vscode from 'vscode';
import { Account } from './Account';
import { Contract } from './Contract';

export class ExtData {
	accounts: Account[];
	contracts: Contract[];

	private static readonly storeKey = "cosmy-wasmy";

	/**
	 *
	 */
	constructor() {
		this.accounts = [];
		this.contracts = [];
	}

	public static GetExtensionData(context: vscode.Memento): ExtData {
		const extData = context.get<string>(ExtData.storeKey);
		if (extData) {
			return JSON.parse(extData);
		}
		return new ExtData();
	}

	public static SaveAccounts(context: vscode.Memento, accounts: Account[]) {
		let data = this.GetExtensionData(context);
		data.accounts = accounts;
		this.SaveExtensionData(context, data);
	}

	public static SaveContracts(context: vscode.Memento, contracts: Contract[]) {
		let data = this.GetExtensionData(context);
		data.contracts = contracts;
		this.SaveExtensionData(context, data);
	}

	public static ResetExtensionData(context: vscode.Memento) {
		context.update(ExtData.storeKey, undefined);
	}

	private static SaveExtensionData(context: vscode.Memento, data: ExtData) {
		context.update(ExtData.storeKey, JSON.stringify(data));
	}
}
