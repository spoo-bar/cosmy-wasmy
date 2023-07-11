import * as vscode from 'vscode';
import { Constants } from '../constants';
import { ChainConfig, Workspace } from '../helpers/workspace';
import { CWSerializer } from './cwNotebookProvider';
import { InitializeViewProvider } from './initializeViewProvider';
import { MigrateViewProvider } from './migrateViewProvider';
import { QueryProvider } from './queryProvider';
import { SignProvider } from './signProvider';
import { TxProvider } from './txProvider';
import { TextDecoder } from 'util';
import { Account } from '../models/account';
import { TestExplorer } from './testExplorer';
import { CwSimulateKernel } from '../notebook/cwSimulateKernel';
import { Coin } from '@cosmjs/amino';
var toml = require('toml');

export class Utils {

    private static selectedChain: vscode.StatusBarItem;
    private static recordStatus: vscode.StatusBarItem = vscode.window.createStatusBarItem(Constants.STATUSBAR_ID_RECORD_STATUS, vscode.StatusBarAlignment.Left);

    public static CreateConnectedChainStatusItem() {
        this.selectedChain = vscode.window.createStatusBarItem(Constants.STATUSBAR_ID_SELECTED_CONFIG, vscode.StatusBarAlignment.Left);
        this.selectedChain.tooltip = vscode.l10n.t("Select a different Chain");
        this.selectedChain.command = "cosmy-wasmy.reloadConfig";
        this.selectedChain.text = "$(debug-disconnect) " + vscode.l10n.t("Not connected to any chain");
        this.UpdateConnectedChainStatusItem();
    }

    public static ShowRecordStatusItem() {
        if (Workspace.GetRecordCW()) {
            // Not recording currently
            this.recordStatus.tooltip = "Stop recording CW API interactions";
            this.recordStatus.command = "cosmy-wasmy.recordCW";
            this.recordStatus.text = "$(stop) Stop recording";
            this.recordStatus.show();
        }
        else {
            // Recording currently
            this.recordStatus.tooltip = "Start recording CW API interactions";
            this.recordStatus.command = "cosmy-wasmy.recordCW";
            this.recordStatus.text = "$(record) Start recording ";
            this.recordStatus.show();
        }
    }

    public static UpdateConnectedChainStatusItem() {
        this.selectedChain.text = "$(plug)" + global.workspaceChain.configName;
        this.selectedChain.show();
        Utils.RefreshExtensionContext();
    }

    public static RefreshExtensionContext() {
        if (global.workspaceChain.faucetEndpoint) {
            vscode.commands.executeCommand('setContext', 'showRequestFunds', true);
        }
        else {
            vscode.commands.executeCommand('setContext', 'showRequestFunds', false);
        }
        if (global.workspaceChain.accountExplorerLink && global.workspaceChain.accountExplorerLink.includes("${accountAddress}")) {
            vscode.commands.executeCommand('setContext', 'showOpenInExplorer', true);
        }
        else {
            vscode.commands.executeCommand('setContext', 'showOpenInExplorer', false);
        }
    }

    public static TransDecimals(balance, decimals) : string{
        if (balance.length <= decimals){
            let zeroLen = decimals - balance.length + 1;
            let zeroStr = "";
            for (let i = 0; i < zeroLen; i++){
                zeroStr =  zeroStr + "0";
            }
            balance = zeroStr + balance;
        }
        return balance.slice(0, balance.length - decimals) + "." + balance.slice(balance.length - decimals)
    }

    public static async BeakerAutoSync(context: vscode.ExtensionContext) {
        if (Workspace.GetBeakerAutosync()) {
            const files = await vscode.workspace.fs.readDirectory(vscode.workspace.workspaceFolders[0].uri);
            const beakerFile = files.filter(f => f[0].toLowerCase() === "beaker.toml");
            if (beakerFile && beakerFile.length == 1) {
                const beakerFilePath = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, "Beaker.toml");
                await Utils.BeakerSync(beakerFilePath, context);
            }
        }
    }

    public static async BeakerSync(beakerFilePath: vscode.Uri, context: vscode.ExtensionContext) {
        const fileBuf = await vscode.workspace.fs.readFile(beakerFilePath);
        const content = toml.parse(new TextDecoder().decode(fileBuf));

        Utils.syncAccounts(content, context);
        Utils.syncChains(content);
    }

    public static ParseCoins(input: string): Coin[] {
        return input
          .replace(/\s/g, "")
          .split(",")
          .filter(Boolean)
          .map((part) => {
            const match = part.match(/^([0-9]+)([a-zA-Z]+)/);
            if (!match) throw new Error("Got an invalid coin string");
            return {
              amount: match[1].replace(/^0+/, "") || "0",
              denom: match[2],
            };
          });
      }

    private static syncChains(content: any) {
        const beakerNetworks = content.networks;
        const networkNames = Object.keys(beakerNetworks);
        for (const networkName of networkNames) {
            const network = beakerNetworks[networkName];
            let chainConfig = new ChainConfig();
            chainConfig.configName = networkName;
            chainConfig.chainId = network.chain_id;
            chainConfig.chainEnvironment = "beaker";
            chainConfig.addressPrefix = content.account_prefix;
            chainConfig.rpcEndpoint = network.rpc_endpoint;
            chainConfig.defaultGasPrice = this.getGasPriceAmount(content.gas_price);
            chainConfig.chainDenom = this.getGasPriceDenom(content.gas_price);
            Workspace.AddChainConfig(chainConfig);
        }
    }

    private static async syncAccounts(content: any, context: vscode.ExtensionContext) {
        const beakerAccounts = content.accounts;
        const accountNames = Object.keys(beakerAccounts);
        for (const accountName of accountNames) {
            const account = beakerAccounts[accountName];
            if (account.mnemonic && account.mnemonic.length > 0) {
                const a = new Account(accountName, account.mnemonic);
                if (!Account.AccountLabelExists(context.globalState, accountName)
                    && !Account.AccountMnemonicExists(context.globalState, account.mnemonic)) {
                    Account.AddAccount(context.globalState, a);
                }
            }
        }
        const accounts = await Account.GetAccounts(context.globalState);
        accountViewProvider.refresh(accounts);
    }

    private static getGasPriceAmount(gas_price: string): string {
        let m;
        let amount = "";
        const regex = /[0-9]*\.?[0-9]+/gm;
        while ((m = regex.exec(gas_price)) !== null) {
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            m.forEach((match, groupIndex) => {
                amount = match;
            });
        }
        return amount;
    }

    private static getGasPriceDenom(gas_price: string): string {
        let m;
        let denom = "";
        const regex = /[a-zA-Z]+/gm;
        while ((m = regex.exec(gas_price)) !== null) {
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            m.forEach((match, groupIndex) => {
                denom = match;
            });
        }
        return denom;
    }
}

export class Views {
    public static Register(context: vscode.ExtensionContext) {
        vscode.window.registerTreeDataProvider(Constants.VIEWS_ACCOUNT, global.accountViewProvider);
        vscode.window.registerTreeDataProvider(Constants.VIEWS_CONTRACT, global.contractViewProvider);

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

        context.subscriptions.push(vscode.workspace.registerNotebookSerializer(Constants.VIEWS_NOTEBOOK, new CWSerializer()));
        context.subscriptions.push(new CwSimulateKernel());

        const testExplorer = new TestExplorer();
    }
}