# Contract 

Import smart contracts from the chain by their contract address.

Once a contract has been imported, you can do the following from the context menu
1. Copy contract address
2. Delete the contract from vscode
3. Change the contract admin - Changes the cosmwasm admin, not any admin set up by the contract itself
4. Remove the contract admin - Changes the cosmwasm admin, not any admin set up by the contract itself
5. Add notes and comments - Developer can add some notes and comments about any smart contract which will be saved locally. Its not connected to any on-chain or cosmwasm feature. It is just for a developer's self reference. This information is shown when the user hovers on the contract in the view. Markdown as well as vscode theme icons are supported in the comments.


![feature Contract](/./images/contract.gif)

![feature Contract Comments](/./images/contract_comments.gif)

If any imported contract has a plug (🔌) icon next to it, it implies that the contract was imported in the same chain as the currently active chain config. 

If the contract does not have a plug (🔌) icon next to it, this means it was imported before v1.0.0 of the extension came out and the extension does not have the relevant information as to which chain config it was imported with. You can delete the contract and reimport it to set it up right.

Contracts which were imported under other chain config are not shown.
