import * as vscode from 'vscode';
import { Constants } from '../constants';
import fetch from 'node-fetch';
import { CWSimulateApp } from '@terran-one/cw-simulate';
var toml = require('toml');

export class CwSimulateKernel {
    readonly controllerId = Constants.VIEWS_NOTEBOOK_CW_SIMULATE_KERNEL;
    readonly notebookType = Constants.VIEWS_NOTEBOOK;
    readonly label = 'cw-simulate';
    readonly supportedLanguages = [Constants.LANGUAGE_JSON, Constants.LANGUAGE_TOML];

    private readonly controller: vscode.NotebookController;
    private executionOrder = 0;
    private contractBinary: Uint8Array;
    private contractSchema: string;

    private readonly app: CWSimulateApp;
    private instance = {
        codeId: 0,
        contractAddress: "",
    }

    constructor() {
        this.controller = vscode.notebooks.createNotebookController(this.controllerId, this.notebookType, this.label);
        this.controller.supportedLanguages = this.supportedLanguages;
        this.controller.supportsExecutionOrder = true;
        this.controller.executeHandler = this.execute.bind(this);
        this.app = new CWSimulateApp({ chainId: 'cw-notebook-1', bech32Prefix: 'cw' });
    }

    private execute(cells: vscode.NotebookCell[], notebook: vscode.NotebookDocument, controller: vscode.NotebookController): void {
        for (let cell of cells) {
            this.doExecution(cell);
        }
    }

    private async doExecution(cell: vscode.NotebookCell): Promise<void> {
        const execution = this.controller.createNotebookCellExecution(cell);
        execution.executionOrder = ++this.executionOrder;
        execution.start(Date.now()); // Keep track of elapsed time to execute cell.

        let lang = cell.document.languageId;
        let input = cell.document.getText();

        if (lang == Constants.LANGUAGE_TOML) {
            this.parseToml(input).catch(error => {
                execution.replaceOutput([
                    new vscode.NotebookCellOutput([
                        vscode.NotebookCellOutputItem.error(error)
                    ])
                ]);
                execution.end(true, Date.now());
            }).then((tt) => {
                execution.replaceOutput([new vscode.NotebookCellOutput([
                    vscode.NotebookCellOutputItem.text("💾 Loaded the above contract and schema to notebook state")
                ]), new vscode.NotebookCellOutput([
                    vscode.NotebookCellOutputItem.text("❗ Remember to first instantiate your contract before executing any query/tx")
                ]), new vscode.NotebookCellOutput([
                    vscode.NotebookCellOutputItem.text("▶️ You can then run any query or tx with this contract")
                ])]);
                execution.end(true, Date.now());
            });
        }
        else if (lang == Constants.LANGUAGE_JSON) {
            const json = JSON.parse(input);
            let response = await this.simulate(json);
            execution.replaceOutput([new vscode.NotebookCellOutput([response])]);
        }
        else {
            execution.replaceOutput([
                new vscode.NotebookCellOutput([
                    vscode.NotebookCellOutputItem.error(new Error("❌ Unknown code block! Expected json/toml blocks"))
                ])
            ]);
        }

    }

    private async simulate(input: any): Promise<vscode.NotebookCellOutputItem> {
        const action = this.getAction(input);
        switch (action) {
            case Action.Instantiate: {
                let response = await this.app.wasm.instantiateContract('', [], this.instance.codeId, input, 'cw-notebook');
                if (response.ok && typeof response.val !== 'string') {
                    this.instance.contractAddress = response.val.events[0].attributes[0].value;
                }
                return vscode.NotebookCellOutputItem.text("🎂 successfully instantiated contract " + this.instance.contractAddress);
            };
            case Action.Query: {
                let response = await this.app.wasm.query(this.instance.contractAddress, input);
                return vscode.NotebookCellOutputItem.json(response.val);
            };
            case Action.Execute: {
                let response = await this.app.wasm.executeContract('', [], this.instance.contractAddress, input);
                return vscode.NotebookCellOutputItem.json(response.val);
            };
            case Action.Invalid:
            default: vscode.NotebookCellOutputItem.error(new Error("❌ Invalid operation"));
        }
    }

    private getAction(input: any): Action {
        const schema = JSON.parse(this.contractSchema);
        const call = Object.keys(input)[0];

        if (schema.instantiate.required[0] == call) {
            return Action.Instantiate;
        }
        if (schema.query.oneOf.map(q => q.required[0]).some(q => q == call)) {
            return Action.Query;
        }
        if (schema.execute.oneOf.map(e => e.required[0]).some(e => e == call)) {
            return Action.Execute;
        }

        return Action.Invalid;
    }

    private async parseToml(cellInput: string) {
        const configParsed = toml.parse(cellInput);
        const contractUrl = configParsed.config["contract-url"];
        const contractResponse = await fetch(contractUrl);
        if (!contractResponse.ok) {
            throw new Error("Could not fetch from contract-url: " + contractResponse.statusText);
        }
        const contractFile = await contractResponse.arrayBuffer();
        this.contractBinary = new Uint8Array(contractFile);
        this.instance.codeId = this.app.wasm.create('', this.contractBinary)
        const schemaUrl = configParsed.config["schema-url"];
        const schemaResponse = await fetch(schemaUrl);
        if (!schemaResponse.ok) {
            throw new Error("Could not fetch from schema-url: " + schemaResponse.statusText);
        }
        this.contractSchema = await schemaResponse.text();
    }

    dispose(): any { }
}

enum Action {
    Invalid,
    Instantiate,
    Query,
    Execute
}