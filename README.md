# Cosmy Wasmy

![feature Cosmy Wasmy Logo](media/icon-small.png)

![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/spoorthi.cosmy-wasmy)
![Visual Studio Marketplace Release Date](https://img.shields.io/visual-studio-marketplace/release-date/spoorthi.cosmy-wasmy)
![GitHub release (latest by date)](https://img.shields.io/github/v/release/spoo-bar/cosmy-wasmy)
[![CodeQL](https://github.com/spoo-bar/cosmy-wasmy/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/spoo-bar/cosmy-wasmy/actions/workflows/codeql-analysis.yml)
[![Mirror to Gitopia](https://github.com/spoo-bar/cosmy-wasmy/actions/workflows/gitopia-mirror.yml/badge.svg)](https://github.com/spoo-bar/cosmy-wasmy/actions/workflows/gitopia-mirror.yml)
![GitHub](https://img.shields.io/github/license/spoo-bar/cosmy-wasmy)

Cosmy Wasmy makes it easy to develop and interact with a [CosmWasm](https://github.com/CosmWasm/cosmwasm) smart contract. With the most popular Cosmwasm chains testnet pre-configured, it makes chain interactions during testing super simple. You can perform all Cosmwasm interactions without touching the CLI.


---

## Getting Started

This section is intended to give you an introduction to using Cosmy Wasmy.

### Prerequisites

* [Rust](https://www.rust-lang.org/tools/install) for building cosmwasm contract
    * [Rustup](https://rustup.rs/) for dealing with wasm target
* [Docker](https://docs.docker.com/get-docker/) for running wasm rust-optimizer 
* [VSCode](https://code.visualstudio.com/) to install the extension in

#### Optional
* [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer) extension for vscode to provide syntax highlighting and othre language server features

---
## Installation

You can install Cosmy Wasmy from the [visual stucio marketplace](https://marketplace.visualstudio.com/items?itemName=spoorthi.cosmy-wasmy) 

Or, you can search for `Cosmy Wasmy` in vscode Extensions sidebar. 

> **Note**
> The extension provides Walkthroughs for the major features. You can access the walkthroughs by going to Command Palette (Windows: `Ctrl+Shft+P`, MacOS: `Cmd+Shft+P`, Linux: `Ctrl+Shft+P`) and selecting **"Welcome: Open Walkthrough"**.

Its recommended post installation to configure the extension for your use case. Here are the first few things you might wanna do.

1. Select your target chain
    The extension is preconfigured with some of the most popular CW-enabled chains. You can find more details in the [Configuration](#configuration) section.

    ![Change Chain Configuration](./images/changeActiveChain.gif)


2. Import accounts
    If you have any prior test accounts, you can import them by going to the Cosmy Wasmy sidebar and adding a new account in the Account view. Or you can choose to create a new account as well. 

    ![Add account](./images/account.gif)

    > **Warning**
    >
    > Do NOT use your mainnet account here. The mnemonic is stored in plain text within vscode

3. Import contracts
    Any contracts deployed on your target chain can be imported here with its address

    ![Add contract](./images/contract.gif)

4. Explore the settings
    Explore all the configurations available in the extension by going to `File > Preferences > Settings > Extensions > Cosmy wasmy`. The detailed documentation of the configurations is available [here](./docs/configuration.md)

---

## Configuration

The following chains are preconfigured by default. Any other chains can be manually added i nthe settings.

|    | Project | Environment | ChainID       |
| -- | ------- | ----------- | ------------- |
| 1 | Osmosis  | testnet     | osmo-test-4   |
| 2 | Juno     | testnet     | uni-6         |
| 3 | Archway  | testnet     | constantine-1 |
| 4 | Stargaze | testnet     | elgafar-1     |
| 5 | Neutron  | testnet     | baryon-1      |
| 6 | Juno     | localnet    | testing       |
| 7 | Osmosis  | localnet    | localosmosis  |

You can set up the extension settings at
> File > Preferences > Settings > Extensions> Cosmy Wasmy

| Setting | Type | Default  | Scope | Details |
| --------|------|----------|-------|---------|
| [Deprecated] ~~`cosmywasmy.chainConfigName`~~ | ~~string~~ | ~~Juno UNI-5~~ | ~~Workspace~~ | ~~This setting is used to select which of the given Chain configs is to be used in this workspace~~ |
| `cosmywasmy.chains`  | json   | *Refer above* | Application | Stores an array of JSON objects which contains the chain config details. <br />  The structure of the expected setting is elaborated below this table  |
| `cosmywasmy.contractSortOrder` | enum   | None | Workspace | Controls the sorting order of the Smart Contracts in the Contract view <br /> * Alphabetical - Sort by the label<br /> * CodeId - Sort by the Code ID<br /> * None - No explicit sorting - Maintains the order the contracts were imported in |
| `cosmywasmy.cosmwasmResponseView` | enum   | Terminal | Workspace | Controls where the smart contract responses should be displayed <br /> * NewFile - Open a new dummy doc with response <br /> * Terminal -  A seperate output channel by Cosmy Wasmy in the Output view |
| `cosmywasmy.maxHistoryStored` | number | 20 | Workspace | Controls the latest number of queries and txs kept in history for easy re-execution. If set to `0` the feature is disabled and nothing is stored |
| `cosmywasmy.openTxExplorerInVscode` | bool | false | Workspace | Controls if tx should be opened in block explorer within vscode |
| `beaker.autosync` | bool | true | Machine | Controls if any accounts configured in Beaker.toml are autonaticcaly loaded into the extension |

The structure of the expected setting for `cosmywasamy.chains`:
```json
[
    {
        "configName": "Osmosis test-4", // A unique human fiendly name for the chain
        "chainId": "osmo-test-4", // The localnet/testnet Chain ID
        "chainEnvironment": "testnet", // Is the chain localnet, testnet or (god forbid 😨) mainnet
        "addressPrefix": "osmo", // Used to derive account address
        "rpcEndpoint": "https://rpc-test.osmosis.zone", // Used for query and tx exec of smart contracts
        "defaultGasPrice": "0.025", // Gas price set for the smart contract tx execution
        "chainDenom": "uosmo", // the micro denom used to pay for gas and to track account balance
        "faucetEndpoint": "http://localhost:8000", //Faucet address and port to request funds
        "accountExplorerLink": "https://testnet.mintscan.io/osmosis-testnet/account/${accountAddress}", //Block explorer url which includes '${accountAddress}' text to generate account url
        "txExplorerLink": "https://testnet.mintscan.io/osmosis-testnet/txs/${txHash}" // Block explorer url which includes '${txHash}' text to generate tx url
    }
]
```



## Docs

You can find detailed docs for each feature here:

### Contributions

* [Settings](/docs/configuration.md) - All the configuration exposed by the extension
* [Commands](/docs/commands.md) - All the commands contributed by the extension

### Features

* [Account](/docs/account.md) - Generate, store and import keys
* [Contract](/docs/contract.md) - Import and upload smart contracts
* [Cosmwasm Interaction](/docs/cosmwasm_interactions.md) - Query, Execute Msg, Migrate and instantiate smart contracts. 
* [Snippets](/docs/snippets.md) - Shortcuts to generate fns to query, execute msg and to write tests

Find release notes in [CHANGELOG](CHANGELOG.md)

## Known Issues

*  The extension has only been tested in Windows environment. However, there is no reason it shouldn't work in native Linux or Mac. Please create an issue if the extension doesn't behave the way expected


## Thanks

Big shoutout to [aswever](https://github.com/aswever), lots of the feature inspirations came from [cosmwasm.tools](https://cosmwasm.tools/).


## Support 

You can support this extension in the following ways:

1. Create issues for any bugs you encounter [here](https://github.com/spoo-bar/cosmy-wasmy/issues/new?assignees=spoo-bar&labels=&template=bug_report.md&title=)
2. Share what features you might be interested  [here](https://github.com/spoo-bar/cosmy-wasmy/issues/new?assignees=&labels=&template=feature_request.md&title=)
3. Contribute code to the extension - PRs are always welcome
4. Share the extension with other devs 💜
5. If you would like to support me([spoo-bar](https://www.spoorthi.dev)) directly, you can donate to this address 

    Juno - `juno1lg8ukq2ehc9k0wgjfk0afm7uea8750yp9gtfct`

    Osmosis - `osmo1lg8ukq2ehc9k0wgjfk0afm7uea8750ypmpmzf9`

    Cosmos Hub - `cosmos1lg8ukq2ehc9k0wgjfk0afm7uea8750ypn6gjlh`

    This extension will never be paywalled. #DevsSupportingDevsByDevving