# Change Log

All notable changes to the Cosmy Wasmy extension will be documented in this file.

<!-- 
## [Unreleased]

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security 
-->

## [v2.3.1] - 07 July 2023

### Removed

- The 'Initialize + Import' button in the contract initialize view.

### Fixed

- Fixed the issue where could not import a new contract after copying an address to the clipboard from the extension

## [v2.3.0] - 12 June 2023

### Added

- Added a feature to have context menu option to base64 encode selected text. Works only in JSON files.
- Send Tokens between imported accounts

### Changed

- Updated Archway constantine-2 to constantine-3 configuration in preset chain config
- Using custom Coin parse as the cosmjs default coin parse does not handle higher decimal coins, which breaks archway support which uses 18 decimal precision

### Fixed

- Fixed issue where contract migration would only allow to migrating to the same Code ID. Thanks to [Barry](https://github.com/zjg555543) from [OKX](https://github.com/okx) for the fix.


## [v2.2.2] - 25 April 2023

### Added
- Support [OKBChain](https://www.okx.com/okbc) - OKB Chain (OKBC) is an Ethereum scaling solution that provides users with high-performance decentralized applications and security, achieved with seamless integration. Added configurations for localnet as well as testnet chains


## [v2.2.1] - 13 April 2023

### Added

- Added cosmy wasmy logo for cw history tab and vm simulate page 

### Fixed

- Closes [#59](https://github.com/spoo-bar/cosmy-wasmy/issues/59) which prevented the extension loading on mac due to webpack export [#51](https://github.com/spoo-bar/cosmy-wasmy/pull/51)


## [v2.2.0] - 11 April 2023

> **Note**
>
> Thanks to [Barry](https://github.com/zjg555543) from [OKX](https://github.com/okx) for all contributions to this release

### Added

- Support [OKTChain](https://www.okx.com/oktc) - OKTC is a L1 blockchain network built on Cosmos that aims for optimal interoperability and performance. Added configurations for localnet as well as testnet chains
- Support `signType`signature algorithm - Can sign compatibly with ethermint, `ethsecp256k1` or `tmsecp256k1`, default `tmsecp256k1`.
- Added `chainDenomDecimals` config - Can display the decimals of account balance.
- Added `chainGasDenom` config - Can use it when submit tx, default use `chainDenom`.
- Add `Admin` input - Can set admin in instantiateContract view, if not set, contract has no admin set.

### Fixed

- Fixed failed to load accounts when import wrong mnemonics.


## [v2.1.0] - 04 April 2023

### Changed

- Updated Archway constantine-1 to constantine-2 configuration in present chain config

### Fixed

- Fixed missing webpack export of `bufferutil` and `utf-8-validate`

## [v2.0.0] - 24 March 2023

Wohoooo!! 🎉
Its **v2.0.0**!!

Thank you [Osmosis Grants](https://grants.osmosis.zone/) for funding the work for this release.

### Added

- Support for CW notebooks - Can instantiate contract, run queries and execute txs from the notebook cell within the cosmwasm virtual machine kernel.
- Added support for `SigningCosmWasmClient.executeMultiple` in API
- Closed [#15](https://github.com/spoo-bar/cosmy-wasmy/issues/15) - Can now send funds while executing a contract and while initializing a contract 💰
- Added `Clear History` button and `Export History as JSON` button to CosmWasm history view
- Auto-generate old-style contract schema when `cargo schema` is run
- Load a wasm binary in a CosmWasm VM. Supports instantiate, query and execute. Uses [`@terran-one/cw-simulate`](https://github.com/Terran-One/cw-simulate). Absolute GOATS those peeps 🎉
    * If schema file exists, it will also show dropdown for query and execute with dummy values filled in
- [Beaker](https://github.com/osmosis-labs/beaker) integration 
    - autosync accounts and chain configs if Beaker.toml is found in the repository. Configured in the setting `beaker.autosync`
    - right click on `Beaker.toml` allows to manually sync the accounts and chain configs from the selected file 
- Contract view 
    - context menu action to fetch and show a selected on-chain contract checksum
    - context menu action to download the selected on-chain contract binary to local workspace
- Enable Localization support. Makes it easier for new languages to be supported.
- Enabled Test Explorer - The extension now finds the tests within the project and shows them in the Test Explorer as well as implements a Test Runner
- Add json autocomplete for inputs for instantiate&migrate msgs
- Walkthroughs which can be accessed by the command palette
- Some extension features are now supported in untrusted workspace - limited support 
- Added Stargaze Elgafar testnet to preset chain config 
- Added Neutron Baryon testnet to preset chain config 

### Changed

- Upgraded @cosmjs libraries to `0.29.5`.
- Changed Juno testnet config to uni-6

### Deprecated

- Deprecated support for vscode versions below `1.74.0`. Due to l10n dependency which is used for localization.

### Removed

- Rust snippets for code completion 

### Fixed

- After Executor refactor, the tx link in the dialog after tx execution success was showing json obj instead of tx hash
- Using vscode native clipboard instead of `clipboardy`, which was not working when used in Windows + WSL.

### Security 


## [v1.2.1] - 25 September 2022

### Fixed

- Fixed the chainid of the latest Juno Uni testnet from uni-4 to uni-5 


## [v1.2.0] - 24 September 2022

### Added

- Added new setting `cosmywasmy.openTxExplorerInVscode`, if set to true, on a successful tx execution, instead of a notification, the tx explorer link will open within vscode in the simple browser. (only works if txExplorerLink is set as well for the chain config)

### Changed

- Changed Juni uni-3 to uni-4 configuration in present chain config

### Fixed

- Fixed issue where it was possible to import multiple accounts with same mnemonic.



## [v1.1.0] - 25 August 2022

### Added

- Showing upload contract option in editor menus as well for wasm files
- Showing query and execute icons on json files to directly call contracts, as well as to the JSON file context menu
- On `cosmy-wasmy.generateSchema`, the json schema is set into the workspace settings so that any json file can get code completion from the query or execute msgs. (Thanks [Callum](https://github.com/Callum-A) for feature suggestion)
- Added category to commands to make it easier to search and find the relevant ones from Command Palette 
- Added Archway Constantine testnet to preset chain config 
- Added `cosmywasmy.chains.chainEnvironment` to chain config which stores if the chain is localnet, testnet or mainnet.
- Added a warning text on hover when the contract is not associated with any chain configs
- On tx completion, a notification shows which links to the tx explorer page based on configuration
- Added command `cosmy-wasmy.refreshAccount` to refresh the account view in the sidebar.

### Changed

- Tooltip on Contract view item hover now shows the contract address and the creator address by default, and appends the notes at the end if any   
- The chain selection now happens from the UI of the extension, and not the Settings page in vscode.
- Instead of showing a plug icon next to contracts with chain config set, now, the contracts without chain config are shown with a plug disconnected icon.
- Default chain configs name changed

### Deprecated

- `cosmywasmy.chainConfigName` setting deprecated and the config will now be set using the extension command `cosmy-wasmy.reloadConfig`

### Fixed

- Fixed issue where could not import same contract address if under different chain config
- Fixed issue where extension would crash and would not start if the rpc endpoint was down.


## [v1.0.0] - 31 July 2022

Wohoooo!! 🎉
Its **v1.0.0**!!

### Added

- Add export saved state to json. Exports the accounts, contracts and any historical queries stored.
- Shows a plug (🔌) icon next to contracts which were imported for the currently active chain config.
- Contract context menu actions to update contract admin and to remove contract admin.
- Added [#10](https://github.com/spoo-bar/cosmy-wasmy/issues/10) - Developers can add small notes and comments to their imported contracts. The added notes are shown on hovering over the contracts in the sidebar contract view. The notes supports markdown. Note : The added notes are only for the dev view, this info is not stored on chain.
- Added [#11](https://github.com/spoo-bar/cosmy-wasmy/issues/11) - Block explorer link added to the account view. If set up, the icon opens the account in a block explorer in the default browser
- Added Osmosis testnet and localnet settings into default populated chain configs

### Changed

- Fixed [#5](https://github.com/spoo-bar/cosmy-wasmy/issues/5) - When a contract is imported, it is automatically associated with the chain config it was imported with. 
- Contract view does not show contracts which were imported under othes chain configs. Only current config contracts or contracts with no config are shown.
- The icons used in extension are now vscode theme-icons and not custom svgs.
- The warning text when `rust-lang.rust-analyzer` is not installed now shows the link to marketplace to download the extention.
- Docs are a bit more organized now, or maybe they are worse. idk. let me know in the comment section below 👇🏻



## [v0.5.0] - 09 July 2022

### Added

- Shows a warning when `rust-lang.rust-analyzer` extension is not installed
- Added "Initialize + Import" option. This automatically imports the contract into Cosmy Wasmy after it has been initialized


## [v0.4.1] - 02 July 2022


### Changed

- Fixed [#9](https://github.com/spoo-bar/cosmy-wasmy/issues/9) - Default key binding for `cosmy-wasmy.history` changed from `ctrl+shift+h` to `ctrl+shift+a`.


## [v0.4.0] - 02 July 2022

### Added

- Snippet to add tests.
- Added command `cosmy-wasmy.history` - When enabled, the latest `cosmywasmy.maxHistoryStored` number of queries are stored and are accessible in history view for easy re-execution. History opens in a new webview as a tab. This command also has a menu icon on the query and execute views.

### Removed

- `msg` snippet to create func for a msg removed. Can still use `tx` for same purpose.

### Fixed

- Custom sorting of the contract view was just straight up not working. Fixed now.
- Fixed [#8](https://github.com/spoo-bar/cosmy-wasmy/issues/8) - Initiation of contract was failing with "Input is not an integer" due to codeId not being parsed into number.


## [v0.3.0] - 23 June 2022

### Added

- Implemented [#3](https://github.com/spoo-bar/cosmy-wasmy/issues/3) & [#4](https://github.com/spoo-bar/cosmy-wasmy/issues/4) - The smart contracts in the Contract view can now be sorted alphabetically, or with CodeID, or in imported order
- Added Migrate view to migrate smart contracts
- Added Initialize view to initialize smart contracts
- Added commands for the following (with keybindings):
    - __cosmy-wasmy.setupDevEnv__ - Setup dev environment and install all dependencies
    - __cosmy-wasmy.build__ - Build the project - `ctrl+shift+b`
    - __cosmy-wasmy.runUnitTests__ - Run unit tests - `ctrl+shift+t`
    - __cosmy-wasmy.optimizeContract__ - Run contract optimizer using the docker image (Needs docker running) - `ctrl+shift+o`
    - __cosmy-wasmy.generateSchema__ - Generate json-schema using the rust schema files - `ctrl+shift+g`
    - __cosmy-wasmy.upload__ - Upload wasm file to chain - `ctrl+shift+u`
- Added placeholder text for all the webviews (query, execute, sign)
- Implemented [#7](https://github.com/spoo-bar/cosmy-wasmy/issues/7) - Added setting so user can choose to output the tx and query responses to the output channel or to new file
- Added snippets to easily add new query and msg functions, and to check if the sender is the smart contract admin.

### Changed

- Implemented [#2](https://github.com/spoo-bar/cosmy-wasmy/issues/2) - Show faucet icon for account only when faucet has been set up for that chain in the settings
- Improved extension startup time by using delayed API calls - could still be refactored more
- Extension used to be activated when the extension view was opened. Now it also gets activated when the language id is rust. (So that project can be built and contracts uploaded without having to activate extension by opening side view) 
- Changed default query/tx response view. Used to open in a new file by default. Now the default setting is to send it to output channel.

### Fixed

- Fixed the query/execute/sign view UIs in high contrast mode


## [v0.2.0] - 15 June 2022

### Added

- Showing account funds in the account view
- Adding request funds from faucet feature

### Changed

- The inline commands moved to context menu for accounts and contracts items

### Fixed

- Fixed [#1](https://github.com/spoo-bar/cosmy-wasmy/issues/1) - Using contract address as id (instead of codeId) for the rendered item in the Contract view



## [v0.1.1] - 03 June 2022

### Changed

- Changed the extension settings. Split the gas price value into seperate price and denom



## [v0.1.0] - 02 June 2022

- Initial release