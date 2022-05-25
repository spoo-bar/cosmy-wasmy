// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { Account } from './models/Account';
import { Contract } from './models/Contract';
import { AccountDataProvider } from './AccountDataProvider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "cosmy-wasmy" is now active!');

	//Account.deleteAllAccounts(context.globalState);

	const accountViewProvider = new AccountDataProvider(context.globalState);
	vscode.window.registerTreeDataProvider('account', accountViewProvider);

	
	const contractViewProvider = new ContractDataProvider(context.globalState);
	vscode.window.registerTreeDataProvider('contract', contractViewProvider);

	registerCommands();

	function registerCommands() {
		registerHelloWorldCmd();
		registerAddAccountCmd();
		registerCopyAccountAddressCmd();
		registerCopyMnemonicCmd();
		registerDeleteAddressCmd();
		registerSelectAccountCmd();
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
							//todo : reload webview aftir new account
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

	function registerCopyAccountAddressCmd() {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.copyAddress', (item: vscode.TreeItem) => {
			if(item.description) {
				vscode.window.showInformationMessage("Copying addr"); //todo
			}
			
		});
		context.subscriptions.push(disposable);
	}

	function registerCopyMnemonicCmd() {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.copyMnemonic', (item: vscode.TreeItem) => {
			if(item.description) {
				vscode.window.showInformationMessage("Copying mnemonic"); //todo
			}
			
		});
		context.subscriptions.push(disposable);
	}

	function registerDeleteAddressCmd() {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.deleteAccount', (item: vscode.TreeItem) => {
			if(item.description) {
				vscode.window.showInformationMessage("Deleting account"); //todo
			}
			
		});
		context.subscriptions.push(disposable);
	}

	function registerSelectAccountCmd() {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.selectAccount', (account: Account) => {
			vscode.window.showInformationMessage(account.mnemonic); 
		});
		context.subscriptions.push(disposable);
	}
}

// this method is called when your extension is deactivated
export function deactivate() { }

export class ContractDataProvider implements vscode.TreeDataProvider<Contract> {

	private contracts: Contract[];

	/**
	 *
	 */
	constructor(context: vscode.Memento) {
		this.contracts = [];
	}
	onDidChangeTreeData?: vscode.Event<void | Contract | Contract[] | null | undefined> | undefined;

	getTreeItem(element: Contract): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return element;
	}

	getChildren(element?: Contract): vscode.ProviderResult<Contract[]> {
		throw new Error('Method not implemented.');
	}

}
