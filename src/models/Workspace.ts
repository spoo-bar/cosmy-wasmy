import * as vscode from 'vscode';
import { Constants } from '../constants';
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
        const configs = this.GetChainConfigs();
        if(configs) {
            const configName = vscode.workspace.getConfiguration().get<string>(Constants.CONFIGURATION_CHAIN_CONFIG_NAME);
            if (!configName) {
                return configs[0];
            }
            const selectedChain = configs.filter(c => c.configName.toLowerCase() === configName.toLowerCase());
            if (!selectedChain || selectedChain.length === 0) {
                throw new Error("Settings has Chain Config Name as " + configName + ". No chain config with that name was found in Chains setting.");
            }
            selectedChain[0].Validate();
            return selectedChain[0];
        }
        throw new Error("Chain settings have not been configured. Please set them up in File > Preferences > Settings > Cosmy Wasmy.");
    }

    private static GetChainConfigs(): ChainConfig[] | undefined {
        const configs = vscode.workspace.getConfiguration().get<ChainConfig[]>(Constants.CONFIGURATION_CHAINS);
        return configs;
    }
}

class ChainConfig {
    configName!: string;
    chainId!: string;
    addressPrefix!: string;
    rpcEndpoint!: string;
    defaultGasPrice!: string;

    public Validate() {
        if (!this) {
            throw new Error("Chain config is null");
        }
        if (!this.configName || this.configName === " ") {
            throw new Error("Chain config name is empty");
        }
        if (!this.chainId || this.chainId === " ") {
            throw new Error("Chain ID is empty");
        }
        if (!this.addressPrefix || this.addressPrefix === " ") {
            throw new Error("Chain address prefix is empty");
        }
        if (!this.rpcEndpoint || this.rpcEndpoint === " ") {
            throw new Error("Chain RPC endpoint is empty");            
        }
        else {
            const url = new URL(this.rpcEndpoint);
        }
        if (!this.defaultGasPrice || this.defaultGasPrice === " ") {
            throw new Error("Default Gas Price is empty");
        }
        return;
    }
}