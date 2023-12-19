export class Constants {

    public static readonly STORE_KEY = "cosmy-wasmy";

    public static readonly CONFIGURATION_CHAIN_CONFIG_NAME = "cosmywasmy.chainConfigName";
    public static readonly CONFIGURATION_CHAINS = "cosmywasmy.chains";
    public static readonly CONFIGURATION_CONTRACT_SORT_ORDER = "cosmywasmy.contractSortOrder";
    public static readonly CONFIGURATION_COSMWASM_RESPONSE_VIEW = "cosmywasmy.cosmwasmResponseView";
    public static readonly CONFIGURATION_HISTORY_STORED = "cosmywasmy.maxHistoryStored";
    public static readonly CONFIGURATION_OPEN_TX_IN_VSCODE = "cosmywasmy.openTxExplorerInVscode";
    public static readonly CONFIGURATION_BEAKER_AUTOSYNC = "beaker.autosync";
    
    public static readonly VIEWS_ACCOUNT = "account";
    public static readonly VIEWS_CONTRACT = "contract";
    public static readonly VIEWS_QUERY = "query";
    public static readonly VIEWS_EXECUTE = "execute";
    public static readonly VIEWS_SIGN = "sign";
    public static readonly VIEWS_MIGRATE = "migrate";
    public static readonly VIEWS_INITIALIZE = "intialize";

    public static readonly VIEWS_NOTEBOOK = "cw-notebook";
    public static readonly VIEWS_NOTEBOOK_CONTROLLER = "cw-notebook-controller-id";
    public static readonly VIEWS_NOTEBOOK_CW_VM_CONTROLLER = "cw-vm-notebook";
    public static readonly VIEWS_NOTEBOOK_CW_SIMULATE_KERNEL = "cw-simulate-kernel";

    public static readonly STATUSBAR_ID_SELECTED_CONFIG = "selectedConfig";
    public static readonly STATUSBAR_ID_RECORD_STATUS = "recordStatus";

    public static readonly LANGUAGE_MARKDOWN = "markdown";
    public static readonly LANGUAGE_TOML = "toml";
    public static readonly LANGUAGE_JSON = "json";
    
    public static readonly SIGN_TYPE = {
        ethsecp256k1: 'ethsecp256k1',
        tmsecp256k1: 'tmsecp256k1'
    };
    public static readonly COMMON_COIN_TYPE = "118";
}
