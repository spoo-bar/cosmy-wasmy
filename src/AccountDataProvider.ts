import * as vscode from 'vscode';
import { Account } from './models/Account';


export class AccountDataProvider implements vscode.TreeDataProvider<Account> {

	private accounts: Account[];

	/**
	 *
	 */
	constructor(context: vscode.Memento) {
		this.accounts = Account.getAccounts(context);
	}

	onDidChangeTreeData?: vscode.Event<void | Account | Account[] | null | undefined> | undefined;

	getTreeItem(element: Account): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return element;
	}

	getChildren(element?: Account): vscode.ProviderResult<Account[]> {
		if (!element) {
			const accounts = this.accounts;
			return Promise.resolve(new Promise(function (resolve, reject) {
				let items: vscode.TreeItem[] = [];
				if (accounts && accounts.length > 0) {
					accounts.forEach(account => {
						account.id = account.label;
						account.description = account.address;
						account.tooltip = account.mnemonic;
						account.contextValue = "account";
						account.command = {
							title: "Select Account",
							command: "cosmy-wasmy.selectAccount",
							arguments: [account]
						};
					});
				};
				resolve(accounts);
			}));
		}
	}

}
