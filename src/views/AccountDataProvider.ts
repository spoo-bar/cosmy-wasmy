import * as vscode from 'vscode';
import { Constants } from '../constants';
import { Account } from '../models/account';


export class AccountDataProvider implements vscode.TreeDataProvider<Account> {

	private accounts: Account[];

	/**
	 *
	 */
	constructor() {
		this.accounts = [];
	}


	private _onDidChangeTreeData: vscode.EventEmitter<void | Account | Account[] | null | undefined> = new vscode.EventEmitter<void | Account | Account[] | null | undefined>();
	readonly onDidChangeTreeData: vscode.Event<void | Account | Account[] | null | undefined> = this._onDidChangeTreeData.event;


	refresh(accounts: Account[]): void {
		this.accounts = accounts;
		this._onDidChangeTreeData.fire(undefined);
	}

	getTreeItem(account: Account): vscode.TreeItem | Thenable<vscode.TreeItem> {
		account.id = account.label;
		account.description = account.balance + global.workspaceChain.chainDenom;
		account.tooltip = account.address;
		account.contextValue = Constants.VIEWS_ACCOUNT;
		account.command = {
			title: vscode.l10n.t("Select Account"),
			command: "cosmy-wasmy.selectAccount",
			arguments: [account]
		};
		return account;
	}

	getChildren(element?: Account): vscode.ProviderResult<Account[]> {
		if (!element) {
			const accounts = this.accounts;
			return accounts;
		}
	}

	public getCurrentAccounts(): Account[] {
		return this.accounts;
	}

}
