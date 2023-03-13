import * as vscode from 'vscode';
import { Constants } from '../constants';
import { SmartExecutor } from "../helpers/cosmwasm/SmartExecutor";
var toml = require('toml');


// This controller for the cw notebook supports connecting the notebook to an exiting chain and run queries and execute msgs against that
export class NotebookChainController {
    readonly controllerId = Constants.VIEWS_NOTEBOOK_CONTROLLER;
    readonly notebookType = Constants.VIEWS_NOTEBOOK;
    readonly label = 'CW Notebook';
    readonly supportedLanguages = ['json', 'toml'];

    private readonly _controller: vscode.NotebookController;
    private _executionOrder = 0;

    // custom config per notebook to keep notebook as self contained as possible
    private _clientConfig = {
        mnemonic: "",
        contractAddress: "",
        rpcEndpoint: "",
        gasPrice: "",
        addressPrefix: "",
    };
    private executor: SmartExecutor;


    constructor() {
        this._controller = vscode.notebooks.createNotebookController(
            this.controllerId,
            this.notebookType,
            this.label
        );

        this._controller.supportedLanguages = this.supportedLanguages;
        this._controller.supportsExecutionOrder = true;
        this._controller.executeHandler = this._execute.bind(this);
        this.executor = new SmartExecutor();
    }

    private _execute(cells: vscode.NotebookCell[], _notebook: vscode.NotebookDocument, _controller: vscode.NotebookController): void {
        for (let cell of cells) {
            this._doExecution(cell);
        }
    }

    private async _doExecution(cell: vscode.NotebookCell): Promise<void> {
        const execution = this._controller.createNotebookCellExecution(cell);
        execution.executionOrder = ++this._executionOrder;
        execution.start(Date.now()); // Keep track of elapsed time to execute cell.

        try {
            let lang = cell.document.languageId;
            let input = cell.document.getText();
            // if the cell is json, assume its a smart contract input and try to execute it
            if (lang == "json") {
                let json = JSON.parse(input);
                let response = await this.executor.SmartCall(this._clientConfig.contractAddress, json, this._clientConfig.mnemonic);

                if (response.isSuccess) {
                    execution.replaceOutput([
                        new vscode.NotebookCellOutput([
                            vscode.NotebookCellOutputItem.json(response.response)
                        ])
                    ]);
                }
                else {
                    execution.replaceOutput([
                        new vscode.NotebookCellOutput([
                            vscode.NotebookCellOutputItem.error(response.response)
                        ])
                    ]);
                }
            }

            // if the cell is toml, assume it is the config to connect to chain to execute contracts
            else if (lang == "toml") {
                let configParsed = toml.parse(input);
                this._clientConfig = configParsed.config;
                await this.executor.SetupAccount(this._clientConfig.mnemonic, this._clientConfig.addressPrefix);
                await this.executor.SetupClient(this._clientConfig.rpcEndpoint, this._clientConfig.gasPrice);

                execution.replaceOutput([new vscode.NotebookCellOutput([
                    vscode.NotebookCellOutputItem.text("💾 " + vscode.l10n.t("Loaded the above data to notebook state"))
                ]), new vscode.NotebookCellOutput([
                    vscode.NotebookCellOutputItem.text("🔑 " + vscode.l10n.t("Your account address is ") + this.executor.GetAccountAddress() + ".")
                ]), new vscode.NotebookCellOutput([
                    vscode.NotebookCellOutputItem.text("▶️ " + vscode.l10n.t("You can now run any query or tx with this account and contract at the given endpoint."))
                ])]);
            }

        }
        catch (error) {
            execution.replaceOutput([
                new vscode.NotebookCellOutput([
                    vscode.NotebookCellOutputItem.error(error)
                ])
            ]);
        }

        execution.end(true, Date.now());
    }

    dispose(): any {
    }
}
