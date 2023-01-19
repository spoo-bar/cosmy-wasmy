import path = require('path');
import { TextDecoder } from 'util';
import * as vscode from 'vscode';
import { Constants } from '../constants';
import init, { vm_execute, vm_instantiate, vm_query } from '../cosmwasm-vm/cosmwebwasm';


// This controller for the cw notebook supports connecting the notebook to cosmwasm vm (which runs in the extension) and run queries and execute msgs against that
export class NotebookCosmwasmController {
    readonly controllerId = Constants.VIEWS_NOTEBOOK_CW_VM_CONTROLLER;
    readonly notebookType = Constants.VIEWS_NOTEBOOK;
    readonly label = 'cosmwasm-vm';
    readonly supportedLanguages = ['json'];

    private readonly _controller: vscode.NotebookController;
    private _executionOrder = 0;

    private wasmBinary: Uint8Array;

    readonly codeId = 0x1;
    readonly sender = 0x1;
    readonly address = 0x1;

    private state: string;
    private decoder = new TextDecoder();


    constructor() {
        this._controller = vscode.notebooks.createNotebookController(
            this.controllerId,
            this.notebookType,
            this.label
        );

        this._controller.supportedLanguages = this.supportedLanguages;
        this._controller.supportsExecutionOrder = false;
        this._controller.executeHandler = this._execute.bind(this);
        this._controller.detail = vscode.l10n.t("Runs the smart contract and its interactions with a cosmwasm virtual machine");

        init().then(r => { });

    }


    private async _execute(cells: vscode.NotebookCell[], notebook: vscode.NotebookDocument, _controller: vscode.NotebookController): Promise<void> {
        for (let cell of cells) {
            await this._doExecution(cell, notebook);
        }
    }

    private async _doExecution(cell: vscode.NotebookCell, notebook: vscode.NotebookDocument): Promise<void> {
        const execution = this._controller.createNotebookCellExecution(cell);
        execution.executionOrder = ++this._executionOrder;
        execution.start(Date.now()); // Keep track of elapsed time to execute cell.

        try {
            if (cell.document.languageId == "json") {
                let input = cell.document.getText();
                let json = JSON.parse(input);
                const call = Object.keys(json)[0];

                const op = await this.identifyOperation(call);
                switch (op) {
                    case Operation.Initialize: {
                        await this.prepStateForInstantiate(notebook);
                        const { state, events } = vm_instantiate(this.sender, this.address, [], this.state, this.wasmBinary, JSON.stringify(json))
                        this.state = this.normalizeState(state);

                        execution.replaceOutput([
                            new vscode.NotebookCellOutput([
                                vscode.NotebookCellOutputItem.json(events)
                            ])
                        ]);
                        break;
                    };
                    case Operation.Query: {
                        if (!this.wasmBinary) {
                            throw new Error(vscode.l10n.t("Could not fetch the wasm binary. The wasm binary is expected in the same folder as the CW Notebook"))
                        }
                        const responseB = vm_query(this.sender, this.address, [], this.state, this.wasmBinary, {
                            wasm: {
                                smart: {
                                    contract_addr: String(this.address),
                                    msg: Buffer.from(JSON.stringify(json)).toString('base64')
                                }
                            }
                        });
                        const response = Buffer.from(responseB, 'base64').toString();
                        execution.replaceOutput([
                            new vscode.NotebookCellOutput([
                                vscode.NotebookCellOutputItem.json(JSON.parse(response))
                            ])
                        ]);
                        break;
                    };
                    case Operation.Tx: {
                        if (!this.wasmBinary) {
                            throw new Error(vscode.l10n.t("Could not fetch the wasm binary. The wasm binary is expected in the same folder as the CW Notebook"))
                        }
                        const { state: state, events: events } = vm_execute(this.sender, this.address, [], this.state, this.wasmBinary, JSON.stringify(json));
                        this.state = this.normalizeState(state);

                        execution.replaceOutput([
                            new vscode.NotebookCellOutput([
                                vscode.NotebookCellOutputItem.json(events)
                            ])
                        ]);
                        break;
                    };
                    case Operation.Unknown:
                    default: {
                        execution.replaceOutput([
                            new vscode.NotebookCellOutput([
                                vscode.NotebookCellOutputItem.error(new Error(vscode.l10n.t("Could not find any matching query or msg endpoint for given input: {call}", { call: call })))
                            ])
                        ]);
                    }
                }
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

    dispose(): any { }

    private async prepStateForInstantiate(notebook: vscode.NotebookDocument) {
        const folder = vscode.Uri.parse(path.dirname(notebook.uri.path));
        const files = await vscode.workspace.fs.readDirectory(folder);
        const wasmFile = files.filter(f => f[0].endsWith(".wasm"));
        if (wasmFile.length < 1) {
            return vscode.window.showErrorMessage(vscode.l10n.t("Did not find any wasm binary in folder of the CW notebook"));
        }
        let wasm = vscode.Uri.joinPath(folder, wasmFile[0][0]);
        const content = await vscode.workspace.fs.readFile(wasm);
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
                    label: 'CW Notebook Contract - ' + wasm,
                },
            },
            next_account_id: this.address + 1,
            transaction_depth: 0,
            gas: {
                checkpoints: [10000000000000],
            },
        };
        this.state = JSON.stringify(initState);
    }

    private normalizeState(state: any) {
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
        return JSON.stringify(state);
    }

    private async identifyOperation(call: string): Promise<Operation> {
        const workspaceFolder = vscode.workspace.workspaceFolders[0];

        const querySchema = vscode.Uri.joinPath(workspaceFolder.uri, "schema", "query_msg.json");
        const queryContent = this.decoder.decode(await vscode.workspace.fs.readFile(querySchema));
        const queries = JSON.parse(queryContent).oneOf.map(q => q.required[0]);
        if (queries.some(q => q == call)) {
            return Operation.Query;
        }

        const executeSchema = vscode.Uri.joinPath(workspaceFolder.uri, "schema", "execute_msg.json");
        const executeContent = this.decoder.decode(await vscode.workspace.fs.readFile(executeSchema));
        const execs = JSON.parse(executeContent).oneOf.map(e => e.required[0]);
        if (execs.some(e => e == call)) {
            return Operation.Tx;
        }

        const instantiateSchema = vscode.Uri.joinPath(workspaceFolder.uri, "schema", "instantiate_msg.json");
        const instantiateContent = this.decoder.decode(await vscode.workspace.fs.readFile(instantiateSchema));
        const instantiateMsg = JSON.parse(instantiateContent);
        if (instantiateMsg.required[0] == call) {
            return Operation.Initialize;
        }

        return Operation.Unknown;
    }
}

enum Operation {
    Initialize,
    Query,
    Tx,
    Unknown
}