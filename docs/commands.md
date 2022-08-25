
# Commands

These commands can be activated using View > Command Palette (Windows: Ctrl+Shft+P, MacOS: Cmd+Shft+P, Linux: Ctrl+Shft+P) 

All the given keybindings can be customized

| Title | Command | Keybinding | Details | 
|-------|---------|------------|---------| 
| Setup Dev Environment | cosmy-wasmy.setupDevEnv |   | Installs rust and cargo dependencies |
| Build                 | cosmy-wasmy.build  | ctrl+shift+b | Builds the project and generates the non-optimized wasm file | 
| Run Unit Tests        | cosmy-wasmy.runUnitTests     | ctrl+shift+t | Runs all the unit tests in the project | 
| Optimize Contract     | cosmy-wasmy.optimizeContract | ctrl+shift+o | Runs the docker contract-optimizer and generates an optimized wasm artifact - Needs docker running | 
| Generate Schema       | cosmy-wasmy.generateSchema | ctrl+shift+g | Generates json-schema using the Rust schema files. This also enables autocomplete for the query and tx json | 
| Upload Contract       | cosmy-wasmy.upload         | ctrl+shift+u | Uploads a wasm file to selected chain with selected account. <br /> Right clicking on a wasm file shows this command in the context menu or command can be invocated using Command Palette/Key Binding and file dialog opens to select a wasm file <br /> Can also be invoked by clicking on the Upload icon in the Contract view | 
| Reload Chain Config   | cosmy-wasmy.reloadConfig   | | Opens a quick pick menu for the user to pick a new chain for the current workspace |
| Reset Data            | cosmy-wasmy.resetData      | | Deletes all the extension stored data, like accounts and contracts. | 
| Show Cosmwasm History | cosmy-wasmy.history | ctrl+shift+a | Shows latest queries and transactions and with saved inputs. Allows easy re-execution of same queries. The number of saved queries is configurable in the settings. | 
| Export Cosmy Wasmy data | cosmy-wasmy.export |  | Export imported accounts, all imported contracts and history as a JSON file. Careful sharing this file with others as it will include your seed phrase | 
