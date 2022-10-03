import * as vscode from 'vscode';
import { Constants } from '../constants';
import init, { InitOutput, vm_instantiate } from '../cosmwasm-vm/cosmwebwasm';


// This controller for the cw notebook supports connecting the notebook to an exiting chain and run queries and execute msgs against that
export class NotebookCosmwasmController {
    readonly controllerId = "cosmwasm-notebook";
    readonly notebookType = Constants.VIEWS_NOTEBOOK;
    readonly label = 'cosmwasm vm';
    readonly supportedLanguages = ['json'];

    private readonly _controller: vscode.NotebookController;
    private _executionOrder = 0;

    private vmInit: InitOutput;
    private wasmBinary: Uint8Array;

    readonly codeId = 0x1337;
    readonly sender = 0xc0dec0de;
    readonly address = 0xcafebabe;

    private state: any;


    constructor() {
        this._controller = vscode.notebooks.createNotebookController(
            this.controllerId,
            this.notebookType,
            this.label
        );

        this._controller.supportedLanguages = this.supportedLanguages;
        this._controller.supportsExecutionOrder = true;
        this._controller.executeHandler = this._execute.bind(this);
        init().then(r => {
            this.vmInit = r;
        })
        let wasm = "cosmy_wasmy_test.wasm";
        vscode.workspace.fs.readFile(vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, wasm)).then(content => {
            this.wasmBinary = content;

            this.state = {
                storage: {},
                codes: {
                    [this.codeId]: Array.from(this.wasmBinary),
                },
                contracts: {
                    [this.address]: {
                        code_id: this.codeId,
                        admin: null,
                        label: '',
                    },
                },
                next_account_id: this.address + 1,
                transaction_depth: 0,
                gas: {
                    checkpoints: [10000000000000],
                },
            }

        });
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


            const { state, events } = vm_instantiate(this.sender, this.address, [], JSON.stringify(this.state), this.wasmBinary, JSON.stringify(json))
            normalize(state);
            execution.replaceOutput([
                new vscode.NotebookCellOutput([
                    vscode.NotebookCellOutputItem.json(events)
                ])
            ]);
            this.state = state;



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

function normalize(state) {
    state.codes = Object.fromEntries(state.codes);
    state.contracts = Object.fromEntries(state.contracts);
    state.storage = Object.fromEntries(state.storage);
    state.storage =
        Object.fromEntries(
            Object.entries(state.storage).map(
                ([k, v]) => [k, {
                    // @ts-ignore
                    data: Object.fromEntries(v.data),
                    // @ts-ignore
                    iterators: Object.fromEntries(v.iterators)
                }]
            )
        );

}