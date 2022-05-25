// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { normalize } from 'path';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "cosmy-wasmy" is now active!');

	//Account.deleteAllAccounts(context.globalState);

	const todayTaskViewProvider = new AccountDataProvider(context.globalState);
	vscode.window.registerTreeDataProvider('account', todayTaskViewProvider);

	registerCommands();

	function registerCommands() {
		registerHelloWorldCmd();
		registerAddAccountCmd();
	}

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	function registerHelloWorldCmd() {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.helloWorld', () => {
			// The code you place here will be executed every time your command is executed
			// Display a message box to the user
			vscode.window.showInformationMessage('Hello World from cosmy wasmy!');
		});

		context.subscriptions.push(disposable);
	}

	function registerAddAccountCmd() {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.addAccount', () => {
			// The code you place here will be executed every time your command is executed
			// Display a message box to the user
			vscode.window.showInputBox({
				title: "Account Label",
				value: "test 2",
			}).then(accountLabel => {
				// todo : check if resp already used
				if (accountLabel) {
					const options = ["Generate seed phrase for me (Recommended)", "I have a seed phrase"];
					vscode.window.showQuickPick(options).then(rr => {
						if (rr) {
							if (rr == "Generate seed phrase for me (Recommended)") {
								DirectSecp256k1HdWallet.generate(24).then(wallet => {
									const account = new Account(accountLabel, wallet.mnemonic)
									Account.addAccount(context.globalState, account);
									vscode.window.showInformationMessage("added new account" + account.label);
								});
							}
							if (rr == "I have a seed phrase") {
								vscode.window.showInputBox({
									title: "Account Mnemonic",
									placeHolder: "Ensure this is not your main account seed phrase. This info is stored in plain text in vscode."
								}).then(mnemonic => {
									if (mnemonic) {
										const account = new Account(accountLabel, mnemonic)
										Account.addAccount(context.globalState, account);
										vscode.window.showInformationMessage("added new account" + account.label);
									}
								})
							}

						}
					});
				}
			})
		});

		context.subscriptions.push(disposable);
	}
}

// this method is called when your extension is deactivated
export function deactivate() { }

class Account {
	label: string;
	mnemonic: string;
	wallet: string;

	/**
	 *
	 */
	constructor(label: string, mnemonic: string) {
		this.label = label;
		this.mnemonic = mnemonic;
		this.wallet = "";
	}

	public static getAccounts(context: vscode.Memento): Account[] {
		const accountData = context.get<Account[]>("account");
		if (accountData) {
			return accountData;
		}
		return [];
	}

	public static addAccount(context: vscode.Memento, account: Account) {
		const accounts = this.getAccounts(context);
		accounts.push(account);
		context.update("account", accounts);
	}

	public static deleteAllAccounts(context: vscode.Memento) {
		context.update("account", []);
	}

	public static getWallets(context: vscode.Memento): Account[] {
		const accountData = this.getAccounts(context);
		accountData.forEach(async account => {
			const wallet = await DirectSecp256k1HdWallet.fromMnemonic(account.mnemonic, {
				prefix: "cosmos",
			})
			const accounts = await wallet.getAccounts()
			const acc = accounts[0];
			account.wallet = acc.address;
		})
		return accountData;
	}
}


export class AccountDataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

	private accounts: Account[];

	/**
	 *
	 */
	constructor(context: vscode.Memento) {
		this.accounts = Account.getWallets(context);
	}

	onDidChangeTreeData?: vscode.Event<void | vscode.TreeItem | vscode.TreeItem[] | null | undefined> | undefined;

	getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return element;
	}
	getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
		if (!element) {
			const accounts = this.accounts;
			return Promise.resolve(new Promise(function (resolve, reject) {
				let items: vscode.TreeItem[] = [];
				if (accounts && accounts.length > 0) {
					accounts.forEach(account => {
						const item = new vscode.TreeItem(account.label);
						item.id = account.label;
						item.description = account.wallet;
						item.tooltip = account.mnemonic;
						item.contextValue = "addr";
						item.command = {
							title: "Hello",
							command: "cosmy-wasmy.helloWorld",
							arguments: [account.mnemonic]
						}
						items.push(item);
					});
				};
				resolve(items);
			}));
		}
	}


}