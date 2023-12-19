import * as vscode from 'vscode';
import { Z_ASCII } from 'zlib';
import { Constants } from '../constants';
import { Account } from '../models/account';
import { Contract } from '../models/contract';


export class Workspace {

    private static selectedAccount: Account;
    private static selectedContract: Contract;
    private static recordCW: boolean = false;

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

    public static GetRecordCW(): boolean {
        return this.recordCW;
    }

    public static ToggleRecordCW() {
        this.recordCW = !this.recordCW;
    }


    public static SetWorkspaceChainConfig(chainConfigName: string) {
        vscode.workspace.getConfiguration().update(Constants.CONFIGURATION_CHAIN_CONFIG_NAME, chainConfigName, vscode.ConfigurationTarget.Workspace);
        global.workspaceChain = this.GetChainConfig(chainConfigName);
    }

    public static SetWorkspaceSchemaAutoComplete(schemaPath: any) {
        vscode.workspace.getConfiguration().update("json.schemas", schemaPath, vscode.ConfigurationTarget.Workspace);
    }

    public static GetWorkspaceChainConfig(): ChainConfig {
        const configName = vscode.workspace.getConfiguration().get<string>(Constants.CONFIGURATION_CHAIN_CONFIG_NAME);
        return this.GetChainConfig(configName);  
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
        const config = vscode.workspace.getConfiguration().get<number>(Constants.CONFIGURATION_HISTORY_STORED, 0);
        return config;
    }

    public static GetOpenTxInSimpleBrowser(): boolean {
        return vscode.workspace.getConfiguration().get<boolean>(Constants.CONFIGURATION_OPEN_TX_IN_VSCODE, false);
    }

    public static GetBeakerAutosync(): boolean {
        return vscode.workspace.getConfiguration().get<boolean>(Constants.CONFIGURATION_BEAKER_AUTOSYNC, false);
    }

    public static GetChainConfigs(): ChainConfig[] | undefined {
        const configs = vscode.workspace.getConfiguration().get<ChainConfig[]>(Constants.CONFIGURATION_CHAINS);
        if (!configs){
            throw new Error(vscode.l10n.t("Chain settings have not been configured. Please set them up in File > Preferences > Settings > Cosmy Wasmy."));
        }
        return configs;
    }

    public static AddChainConfig(chainConfig: ChainConfig) {
        const configs = this.GetChainConfigs();
        if(configs.some(c => c.chainId == chainConfig.chainId)) {
            return; // dont fail silently in the future. but now only way to add is through beaker so its fine
        }
        configs.push(chainConfig);
        vscode.workspace.getConfiguration().update(Constants.CONFIGURATION_CHAINS, configs, vscode.ConfigurationTarget.Global)
    }

    private static GetChainConfig(chainConfigName?: string): ChainConfig {
        const configs = this.GetChainConfigs();
        let selecetdChain;
        if (!chainConfigName){
            selecetdChain=configs[0];
        } else { 
            const selectedChains = configs.filter(c => c.configName.toLowerCase() === chainConfigName.toLowerCase());
            if (!selectedChains || selectedChains.length === 0) {
                vscode.window.showErrorMessage(vscode.l10n.t("Currently selected chain is '{chain}' but no chain config with that name was found in the configured chains. \n Selecting fallback chain '{defaultChain}'", {
                    chain: chainConfigName,
                    defaultChain: configs[0].configName
                }));
                selecetdChain = configs[0];
            } else {
                selecetdChain = selectedChains[0];
            }
        }
        const configWithDefault= new ChainConfig(selecetdChain);
        configWithDefault.Validate();
        return configWithDefault;
    }
}

export enum CosmwasmResponseView {
    NewFile = "NewFile",
    Terminal = "Terminal"
}

export enum ContractSortOrder {
    Alphabetical = "Alphabetical",
    CodeId = "CodeId",
    None = "None"
}

export class ChainConfig {
    configName!: string;
    chainId!: string;
    chainEnvironment!: string;
    addressPrefix!: string;
    rpcEndpoint!: string;
    defaultGasPrice!: string;
    chainDenom!: string;
    faucetEndpoint!: string;
    accountExplorerLink!: string;
    txExplorerLink!: string;
    chainGasDenom!: string;
    chainDenomDecimals!: string;
    signType!: string;
    coinType!: string;

    constructor(config: Partial<ChainConfig>={}) {
        ({
          configName: this.configName,
          chainId: this.chainId,
          chainEnvironment: this.chainEnvironment,
          addressPrefix: this.addressPrefix,
          rpcEndpoint: this.rpcEndpoint,
          defaultGasPrice: this.defaultGasPrice,
          chainDenom: this.chainDenom,
          faucetEndpoint: this.faucetEndpoint,
          accountExplorerLink : this.accountExplorerLink,
          txExplorerLink: this.txExplorerLink,
          chainGasDenom: this.chainGasDenom,
          chainDenomDecimals: this.chainDenomDecimals,
          signType: this.signType = Constants.SIGN_TYPE.tmsecp256k1,
          coinType: this.coinType = Constants.COMMON_COIN_TYPE,
        } = config);
      }

    public Validate() {
        if (!this) {
            vscode.window.showErrorMessage(vscode.l10n.t("Selected chain config is null, please check"));
            throw new Error(vscode.l10n.t("Chain config is null"));
        }
        if (!this.configName || this.configName === " ") {
            vscode.window.showErrorMessage(vscode.l10n.t("Selected chain config name is empty, please check"));
            throw new Error(vscode.l10n.t("Chain config name is empty"));
        }
        if (!this.chainId || this.chainId === " ") {
            vscode.window.showErrorMessage(vscode.l10n.t("Selected chain ID is empty, please check"));
            throw new Error(vscode.l10n.t("Chain ID is empty"));
        }
        if (!this.addressPrefix || this.addressPrefix === " ") {
            vscode.window.showErrorMessage(vscode.l10n.t("Selected chain address prefix is empty, please check"));
            throw new Error(vscode.l10n.t("Chain address prefix is empty"));
        }
        if (!this.rpcEndpoint || this.rpcEndpoint === " ") {
            vscode.window.showErrorMessage(vscode.l10n.t("Selected chain RPC endpoint is empty, please check"));
            throw new Error(vscode.l10n.t("Chain RPC endpoint is empty"));
        }
        if (!this.defaultGasPrice || this.defaultGasPrice === " ") {
            vscode.window.showErrorMessage(vscode.l10n.t("Selected chain default Gas Price is empty, please check"));
            throw new Error(vscode.l10n.t("Default Gas Price is empty"));
        }
        if (!this.chainDenom || this.chainDenom === " ") {
            vscode.window.showErrorMessage(vscode.l10n.t("Selected chain denom is empty, please check"));
            throw new Error(vscode.l10n.t("Chain denom is empty"));
        }
        if (!Object.values(Constants.SIGN_TYPE).includes(this.signType)) {
            vscode.window.showErrorMessage(vscode.l10n.t("Selected chain sign type is uncorrect, please check"));
            throw new Error(vscode.l10n.t("Chain sign type is uncorrect"));
        }
        if (isNaN(Number(this.coinType))){
            vscode.window.showErrorMessage(vscode.l10n.t("Selected chain coin type is uncorrect, please check"));
            throw new Error(vscode.l10n.t("Chain coin type is uncorrect"));   
        }
    }
}
