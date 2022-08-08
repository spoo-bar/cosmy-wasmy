# Change Log

All notable changes to the "cosmy-wasmy" extension will be documented in this file.

<!-- 
## [Unreleased]

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security 
-->

## [Unreleased]

### Added

- Showing upload contract option in editor menus as well for wasm files
- Showing query and execute icons on json files to directly call contracts
- New command `cosmy-wasmy.executeCosmwasm` which will run the current json file as input to Cosmwasm query or tx

### Changed

- Tooltip on Contract view item hover now shows the contract address and the creator address by default, and appends the notes at the end if any   


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