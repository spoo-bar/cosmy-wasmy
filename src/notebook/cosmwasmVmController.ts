import * as vscode from 'vscode';
import init, { vm_execute, vm_instantiate, vm_query } from 'cosmwebwasm';
import { Constants } from '../constants';


// This controller for the cw notebook supports connecting the notebook to an exiting chain and run queries and execute msgs against that
export class NotebookCosmwasmController {
    readonly controllerId = "cosmwasm-notebook";
    readonly notebookType = Constants.VIEWS_NOTEBOOK;
    readonly label = 'cosmwasm vm';
    readonly supportedLanguages = ['json'];

    private readonly _controller: vscode.NotebookController;
    private _executionOrder = 0;


    constructor() {
        this._controller = vscode.notebooks.createNotebookController(
            this.controllerId,
            this.notebookType,
            this.label
        );

        this._controller.supportedLanguages = this.supportedLanguages;
        this._controller.supportsExecutionOrder = true;
        this._controller.executeHandler = this._execute.bind(this);
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
            let input = cell.document.getText();

            let json = JSON.parse(input);


            let response = {
                isSuccess: true,
                response: "tttt"
            }

            if (response.isSuccess) {
                execution.replaceOutput([
                    new vscode.NotebookCellOutput([
                        vscode.NotebookCellOutputItem.json(response.response)
                    ])
                ]);
            }
            else {
                // execution.replaceOutput([
                //     new vscode.NotebookCellOutput([
                //         vscode.NotebookCellOutputItem.error(response.response)
                //     ])
                // ]);
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
