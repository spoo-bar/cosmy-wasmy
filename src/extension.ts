// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Account } from './models/Account';
import { AccountDataProvider } from './views/AccountDataProvider';
import { ContractDataProvider } from './views/ContractDataProvider';
import { Contract } from './models/Contract';
import { SignProvider } from './views/SignProvider';
import { QueryProvider } from './views/QueryProvider';
import { TxProvider } from './views/TxProvider';
import { Workspace } from './helpers/Workspace';
import { Constants } from './constants';
import { MigrateViewProvider } from './views/MigrateViewProvider';
import { InitializeViewProvider } from './views/InitializeViewProvider';
import { Commands } from './commands/command';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	let chainSelected = vscode.window.createStatusBarItem(Constants.STATUSBAR_ID_SELECTED_CONFIG, vscode.StatusBarAlignment.Left);
	chainSelected.tooltip = "Select a different Chain";
	chainSelected.command = "cosmy-wasmy.reloadConfig";
	refreshExtensionContext();

	var accountViewProvider = new AccountDataProvider();
	vscode.window.registerTreeDataProvider(Constants.VIEWS_ACCOUNT, accountViewProvider);

	const contractViewProvider = new ContractDataProvider();
	vscode.window.registerTreeDataProvider(Constants.VIEWS_CONTRACT, contractViewProvider);

	const signingViewProvider = new SignProvider(context.extensionUri);
	context.subscriptions.push(vscode.window.registerWebviewViewProvider(Constants.VIEWS_SIGN, signingViewProvider));

	const queryViewProvider = new QueryProvider(context.extensionUri, context.globalState);
	context.subscriptions.push(vscode.window.registerWebviewViewProvider(Constants.VIEWS_QUERY, queryViewProvider));

	const txViewProvider = new TxProvider(context.extensionUri, context.globalState);
	context.subscriptions.push(vscode.window.registerWebviewViewProvider(Constants.VIEWS_EXECUTE, txViewProvider));

	const migrateViewProvider = new MigrateViewProvider(context.extensionUri, context.globalState);
	context.subscriptions.push(vscode.window.registerWebviewViewProvider(Constants.VIEWS_MIGRATE, migrateViewProvider));

	const initializeViewProvider = new InitializeViewProvider(context.extensionUri);
	context.subscriptions.push(vscode.window.registerWebviewViewProvider(Constants.VIEWS_INITIALIZE, initializeViewProvider));
	
	Commands.Register(context);

	function loadChainConfig() {
		const config = Workspace.GetWorkspaceChainConfig();
		chainSelected.text = "$(plug)" + config.configName;
		chainSelected.show();
		refreshExtensionContext();
	}

	function refreshExtensionContext() {
		const config = Workspace.GetWorkspaceChainConfig();
		if (config.faucetEndpoint) {
			vscode.commands.executeCommand('setContext', 'showRequestFunds', true);
		}
		else {
			vscode.commands.executeCommand('setContext', 'showRequestFunds', false);
		}
		if (config.accountExplorerLink && config.accountExplorerLink.includes("${accountAddress}")) {
			vscode.commands.executeCommand('setContext', 'showOpenInExplorer', true);
		}
		else {
			vscode.commands.executeCommand('setContext', 'showOpenInExplorer', false);
		}
	}

	try {
		loadChainConfig();

	}
	catch (error: any) {
		vscode.window.showErrorMessage(error.message);
		return;
	}

	const rustLangExtension = vscode.extensions.getExtension('rust-lang.rust-analyzer');
	if (!rustLangExtension) {
		vscode.window.showWarningMessage(new vscode.MarkdownString("We recommend to install the [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer) extention while working with Rust on vscode.").value)
	}

	contractViewProvider.refresh(Contract.GetContracts(context.globalState));
	accountViewProvider.refresh(await Account.GetAccounts(context.globalState));
}

// this method is called when your extension is deactivated
export function deactivate() {
}

