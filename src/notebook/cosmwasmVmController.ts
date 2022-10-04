import { TextDecoder } from 'util';
import * as vscode from 'vscode';
import { Constants } from '../constants';
import init, { InitOutput, vm_execute, vm_instantiate } from '../cosmwasm-vm/cosmwebwasm';


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

    private state: string;
    private decoder = new TextDecoder();


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

            const initState = {
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
            };
            this.state = JSON.stringify(initState);

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
            const workspaceFolder = vscode.workspace.workspaceFolders[0];

            let json = JSON.parse(input);
            const call = Object.keys(json)[0];

            const querySchema = vscode.Uri.joinPath(workspaceFolder.uri, "schema", "query_msg.json");
            const queryContent = this.decoder.decode(await vscode.workspace.fs.readFile(querySchema));
            const queries = JSON.parse(queryContent).oneOf.map(q => q.required[0]);
            if (queries.some(q => q == call)) {

            }

            const executeSchema = vscode.Uri.joinPath(workspaceFolder.uri, "schema", "execute_msg.json");
            const executeContent = this.decoder.decode(await vscode.workspace.fs.readFile(executeSchema));
            const execs = JSON.parse(executeContent).oneOf.map(e => e.required[0]);
            if (execs.some(e => e == call)) {

            }

            const instantiateSchema = vscode.Uri.joinPath(workspaceFolder.uri, "schema", "instantiate_msg.json");
            const instantiateContent = this.decoder.decode(await vscode.workspace.fs.readFile(instantiateSchema));
            const instantiateMsg = JSON.parse(instantiateContent);
            if (instantiateMsg.required[0] == call) {
                const { state, events } = vm_instantiate(this.sender, this.address, [], this.state, this.wasmBinary, JSON.stringify(json))
                normalize(state);
                this.state = JSON.stringify(state);

                execution.replaceOutput([
                    new vscode.NotebookCellOutput([
                        vscode.NotebookCellOutputItem.json(events)
                    ])
                ]); 
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