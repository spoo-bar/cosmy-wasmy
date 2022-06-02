import * as vscode from 'vscode';
import { Constants } from '../constants';
import { Account } from './Account';
import { Contract } from './Contract';

export class ExtData {
	accounts: Account[];
	contracts: Contract[];

	/**
	 *
	 */
	constructor() {
		this.accounts = [];
		this.contracts = [];
	}

	public static GetExtensionData(context: vscode.Memento): ExtData {
		const extData = context.get<string>(Constants.STORE_KEY);
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
		context.update(Constants.STORE_KEY, undefined);
	}

	private static SaveExtensionData(context: vscode.Memento, data: ExtData) {
		context.update(Constants.STORE_KEY, JSON.stringify(data));
	}
}
