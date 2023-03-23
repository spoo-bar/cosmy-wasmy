# cosmy-wasmy 

![feature Cosmy Wasmy Logo](media/icon-small.png)

![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/spoorthi.cosmy-wasmy)
![Visual Studio Marketplace Release Date](https://img.shields.io/visual-studio-marketplace/release-date/spoorthi.cosmy-wasmy)
![GitHub release (latest by date)](https://img.shields.io/github/v/release/spoo-bar/cosmy-wasmy)
[![CodeQL](https://github.com/spoo-bar/cosmy-wasmy/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/spoo-bar/cosmy-wasmy/actions/workflows/codeql-analysis.yml)
[![Mirror to Gitopia](https://github.com/spoo-bar/cosmy-wasmy/actions/workflows/gitopia-mirror.yml/badge.svg)](https://github.com/spoo-bar/cosmy-wasmy/actions/workflows/gitopia-mirror.yml)
![GitHub](https://img.shields.io/github/license/spoo-bar/cosmy-wasmy)

Cosmy Wasmy makes it easy to develop and interact with a [CosmWasm](https://github.com/CosmWasm/cosmwasm) smart contract. With the most popular Cosmwasm chains testnet pre-configured, it makes chain interactions during testing super simple. You can perform all Cosmwasm interactions without touching the CLI.


This extension allows you to interact with Cosmwasm contracts on local, testnet or mainnet chains


![feature Show Cosmwasn History](walkthrough/cosmwasm/history.gif)

Remix IDE is an online development environment for creating smart contracts and decentralized applications (dApps) on the Ethereum blockchain. It provides developers with a comprehensive set of tools and features to write, test, and deploy Solidity smart contracts. Some of the key features of Remix IDE include:

Code Editor: Remix IDE provides a code editor that supports syntax highlighting, code completion, and error highlighting to help developers write Solidity code.

Compiler: Remix IDE includes a compiler that can be used to compile Solidity code into bytecode, which can be executed on the Ethereum Virtual Machine (EVM).

Debugger: Developers can use Remix IDE's debugger to step through their Solidity code and identify any bugs or errors.

Testing Framework: Remix IDE provides a testing framework that allows developers to write automated tests for their smart contracts.

Deployment: Once a smart contract is written and tested, Remix IDE can be used to deploy it to the Ethereum network.

Overall, Remix IDE is a powerful tool that simplifies the process of developing smart contracts and dApps on Ethereum.


## Get Started

To get started with Cosmwasm Smart Contract development in vscode,

1. Install Rustup by following the instructions [here](https://rustup.rs/)
2. Install vscode from [here](https://code.visualstudio.com/Download)
3. Install Cosmy Wasmy from [here](https://marketplace.visualstudio.com/items?itemName=spoorthi.cosmy-wasmy) or search for `Cosmy Wasmy` in vscode Extensions sidebar. 
4. Run the `Setup Dev Environment` command by opening the Command Palette in vscode (Windows: Ctrl+Shft+P, MacOS: Cmd+Shft+P, Linux: Ctrl+Shft+P) .

All the required components will now be installed for you to start your smart contract development.

To access all the Cosmwasm related features, click on the Cosmy Wasmy icon on the sidebar.

The extension by default connects to the Juno `uni-5` testnet. You can go to the [settings](/docs/configuration.md) and customize this to target your local instance or any other testnet.

## Warnings

*  The seedphrases are stored in plaintext within vscode. `DO NOT USE YOUR ACTUAL WALLET SEED PHRASE WITH THIS EXTENSION`

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