
# Extension Configuration

**[Juno uni-5 testnet](https://testnet.ping.pub/juno)**, **[Localnet - Juno](https://github.com/CosmosContracts/juno/pkgs/container/juno)**, **[Testnet - Osmosis](https://docs.osmosis.zone/developing/network/explorers.html#testnet)** and **[Localnet - Osmosis](https://docs.osmosis.zone/developing/tools/localosmosis.html#what-is-localosmosis)** configs are preset by default. Any other chain can be manually added.

You can set up the extension settings here 
> File > Preferences > Settings > Cosmy Wasmy



| Setting | Type | Default  | Scope | Details |
| --------|------|----------|-------|---------|
| [Deprecated] ~~`cosmywasmy.chainConfigName`~~ | ~~string~~ | ~~Juno UNI-5~~ | ~~Workspace~~ | ~~This setting is used to select which of the given Chain configs is to be used in this workspace~~ |
| `cosmywasmy.chains`  | json   | Juno UNI-5, Juno, Osmosis test-4, Osmosis, Archway constantine-1 config | Application | This setting stores an array of JSON objects which contains the Chain config details. <br /> This setting can be expanded to include any localnet or testnet chains (_mainnet not recommended_). <br/> The structure of the expected setting is elaborated below this table  |
| `cosmywasmy.contractSortOrder` | enum   | None | Workspace | This setting controls the sorting order of the Smart Contracts in the Contract view <br /> * Alphabetical - Sort the Smart Contracts alphabetically by their label<br /> * CodeId - Sort the Smart Contracts by the Code ID<br /> * None - No explicit sorting - Maintains the order the contracts were imported in |
| `cosmywasmy.cosmwasmResponseView` | enum   | Terminal | Workspace | This setting controls where the smart contract interactions should be displayed <br /> * NewFile - Open a new dummy doc with response <br /> * Terminal -  A seperate output channel by Cosmy Wasmy in the Output view |
| `cosmywasmy.maxHistoryStored` | number | 20 | Workspace | Controls the latest number of queries and txs kept in history for easy re-execution. If set to `0` the feature is disabled and nothing is stored |


The structure of the expected setting for `cosmywasamy.chains`:
```json
[
    {
        "configName": "Juno UNI-5 testnet", // This need to match exactly the `cosmywasmy.chainConfigName` when the chain config needs to be selected
        "chainId": "uni-5", // The localnet/testnet Chain ID
        "chainEnvironment": "testnet", // Is the chain localnet, testnet or (god forbid 😨) mainnet
        "addressPrefix": "juno", // Used to derive account address
        "rpcEndpoint": "https://rpc.uni.junonetwork.io/", // Used for query and tx exec of smart contracts
        "defaultGasPrice": "0.025", // Gas price set for the smart contract tx execution
        "chainDenom": "ujunox", // the micro denom used to pay for gas and to track account balance
        "faucetEndpoint": "http://localhost:8000", //Faucet address and port to request funds
        "accountExplorerLink": "https://testnet.mintscan.io/juno-testnet/account/${accountAddress}", //Block explorer url which includes '${accountAddress}' text to generate account url
        "txExplorerLink": "https://testnet.mintscan.io/juno-testnet/txs/${txHash}" // Block explorer url which includes '${txHash}' text to generate tx url
    }
]
```
