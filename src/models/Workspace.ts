import * as vscode from 'vscode';
import { Account } from './Account';
import { Contract } from './Contract';


export class Workspace {

    private static selectedAccount: Account;
    private static selectedContract: Contract;

    public static GetSelectedAccount(): Account {
        return this.selectedAccount;
    }

    public static SetSelectedAccount(account: Account) {
        this.selectedAccount = account;
    }

    public static GetSelectedContract(): Contract {
        return this.selectedContract;
    }

    public static SetSelectedContract(contract: Contract) {
        this.selectedContract = contract;
    }

    public static GetWorkspaceChainConfig(): ChainConfig {
        let config = new ChainConfig();

        const chainName = vscode.workspace.getConfiguration().get<string>("chainName");
        if (!chainName) {
            vscode.window.showErrorMessage("Chain Name not set in the settings");
        }
        else {
            config.chainName = chainName;
        }
        const addressPrefix = vscode.workspace.getConfiguration().get<string>("addressPrefix");
        if (!addressPrefix) {
            vscode.window.showErrorMessage("Address prefix not set in the settings");
        }
        else {
            config.addressPrefix = addressPrefix;
        }
        const rpcEndpoint = vscode.workspace.getConfiguration().get<string>("rpcEndpoint");
        if (!rpcEndpoint) {
            vscode.window.showErrorMessage("RPC endpoint not set in the settings");
        }
        else {
            config.rpcEndpoint = rpcEndpoint;
        }

        return config;
    }
}

class ChainConfig {
    chainName!: string;
    addressPrefix!: string;
    rpcEndpoint!: string;
}