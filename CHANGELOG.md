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

- Implemented [#3](https://github.com/spoo-bar/cosmy-wasmy/issues/3) & [#4](https://github.com/spoo-bar/cosmy-wasmy/issues/4) - The smart contracts in the Contract view can now be sorted alphabetically, or with CodeID, or in imported order
- Added Migrate view to migrate smart contracts
- Added Initialize view initialize smart contracts
- Added commands for the following :
    - `cosmy-wasmy.setupDevEnv` - Setup dev environment and install all dependencies
    - `cosmy-wasmy.build` - Build the project
    - `cosmy-wasmy.runUnitTests` - Run unit tests
    - `cosmy-wasmy.optimizeContract` - Run contract optimizer using the docker image (Needs docker running)
    - `cosmy-wasmy.generateSchema` - Generate json-schema using the rust schema files 
    - `cosmy-wasmy.upload` - Upload wasm file to chain
- Added placeholder text for all the webviews (query, execute, sign)

### Changed

- Implemented [#2](https://github.com/spoo-bar/cosmy-wasmy/issues/2) - Show faucet icon for account only when faucet has been set up for that chain in the settings
- Improved extension startup time by using delayed API calls - could still be refactored more

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