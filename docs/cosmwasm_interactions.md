# Cosmwasm

## Query

Input the JSON request query data and select the smart contract from the above view to query and the response/err will be output. The historical queries are also stored and can be accessed by `Show Cosmwasm History` command for easy re-execution.

![feature Query](/./images/query.gif)

## Execute

Input the JSON request tx data and select the smart contract as well as the wallet account from the above view to sign and broadcast the transaction and the response/err will be output The historical txs are also stored and can be accessed by `Show Cosmwasm History` command for easy re-execution.

![feature Execute](/./images/execute.gif)


## Sign

Input the text which needs to be signed and select the wallet account in the view above and the signature/err will be output

![feature Sign](/./images/sign.gif)

## Migrate

Input the JSON request migrate data and select the smart contract as well as the wallet account from the above view to sign and broadcast the transaction and the response/err will be output

![feature Migrate](/./images/migrate.png)

## Initialize

Specify the Code Id of the uploaded contract wasm and provide a label for the smart contract. Include any JSON initialization information needed and select the wallet account from the account view to sign and broadcast the transaction and the response/err will be output.

The selected account will be set as admin for the contract.

![feature Initialize](/./images/initiate.png)

## Upload Wasm Smart Contract

You can also upload a wasm file to selected chain with selected account. 

Right clicking on a wasm file shows this command in the context menu or command can be invoked using Command Palette/Key Binding and file dialog opens to select a wasm file.

![feature Upload Contract](/./images/upload.gif)