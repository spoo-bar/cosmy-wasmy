import { TextDecoder, TextEncoder } from 'util';
import * as vscode from 'vscode';
import { Cosmwasm } from '../helpers/cosmwasm/api';
import { Executer, SmartExecutor } from '../helpers/cosmwasm/executer';
import { Contract } from '../models/contract';

interface RawNotebookCell {
    language: string;
    value: string;
    kind: vscode.NotebookCellKind;
}

export class CWSerializer implements vscode.NotebookSerializer {

    async deserializeNotebook(content: Uint8Array, _token: vscode.CancellationToken): Promise<vscode.NotebookData> {
        var contents = new TextDecoder().decode(content);

        let raw: RawNotebookCell[];
        try {
            raw = <RawNotebookCell[]>JSON.parse(contents);
        } catch {
            raw = [];
        }

        const cells = raw.map(
            item => new vscode.NotebookCellData(item.kind, item.value, item.language)
        );

        return new vscode.NotebookData(cells);
    }

    async serializeNotebook(data: vscode.NotebookData, _token: vscode.CancellationToken): Promise<Uint8Array> {
        let contents: RawNotebookCell[] = [];

        for (const cell of data.cells) {
            contents.push({
                kind: cell.kind,
                language: cell.languageId,
                value: cell.value
            });
        }

        return new TextEncoder().encode(JSON.stringify(contents));
    }
}

export class CWController {
    readonly controllerId = 'cw-notebook-controller-id';
    readonly notebookType = 'cw-notebook';
    readonly label = 'CW Notebook';
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

        /* Do some execution here; not implemented */

        try {
            let input = cell.document.getText()
            let json = JSON.parse(input);

            let response = await new SmartExecutor().SmartCall("juno1hm6ur9xkhlnm5uhfmwcqczr3pmywldfvgs3a85jg5yjsdw5lwlcqpjerky", json)

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
        catch (error) {
            execution.replaceOutput([
                new vscode.NotebookCellOutput([
                    vscode.NotebookCellOutputItem.error(error)
                ])
            ]);
        }
        
        execution.end(true, Date.now());
    }

    dispose() : any {

    }
}