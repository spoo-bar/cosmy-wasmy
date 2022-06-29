import * as vscode from 'vscode';
import { Constants } from '../constants';
import { Account } from '../models/Account';
import { Contract } from '../models/Contract';


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
            const selectedChains = configs.filter(c => c.configName.toLowerCase() === configName.toLowerCase());
            if (!selectedChains || selectedChains.length === 0) {
                throw new Error("Settings has Chain Config Name as " + configName + ". No chain config with that name was found in Chains setting.");
            }
            const selecetdChain = selectedChains[0];
            //selecetdChain.Validate();
            return selecetdChain;
        }
        throw new Error("Chain settings have not been configured. Please set them up in File > Preferences > Settings > Cosmy Wasmy.");
    }

    public static GetContractSortOrder(): ContractSortOrder {
        const config = vscode.workspace.getConfiguration().get<ContractSortOrder>(Constants.CONFIGURATION_CONTRACT_SORT_ORDER, ContractSortOrder.None);
        return config;
    }

    public static GetCosmwasmResponseView(): CosmwasmResponseView {
        const config = vscode.workspace.getConfiguration().get<CosmwasmResponseView>(Constants.CONFIGURATION_COSMWASM_RESPONSE_VIEW, CosmwasmResponseView.Terminal);
        return config;
    }

    public static GetCosmwasmQueriesStored(): number {
        const config = vscode.workspace.getConfiguration().get<number>(Constants.CONFIGURATION_QUERY_HISTORY, 0);
        return config;
    }

    private static GetChainConfigs(): ChainConfig[] | undefined {
        const configs = vscode.workspace.getConfiguration().get<ChainConfig[]>(Constants.CONFIGURATION_CHAINS);
        return configs;
    }
}

export enum CosmwasmResponseView {
    NewFile = "NewFile", 
    Terminal = "Terminal"
}

export enum ContractSortOrder {
    Alphabetical, 
    CodeId,
    None
}

class ChainConfig {
    configName!: string;
    chainId!: string;
    addressPrefix!: string;
    rpcEndpoint!: string;
    defaultGasPrice!: string;
    chainDenom!: string;
    faucetEndpoint!: string;

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
        if (!this.chainDenom || this.chainDenom === " ") {
            throw new Error("Chain denom is empty");
        }
        return;
    }
}