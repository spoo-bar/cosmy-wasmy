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