import { TextDecoder, TextEncoder } from 'util';
import * as vscode from 'vscode';
import { Constants } from '../constants';
var toml = require('toml');

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

        const notebook = new vscode.NotebookData(cells);
        try {
            this.validateNotebook(notebook);
        }
        catch (err) {
            vscode.window.showErrorMessage("Error validating the notebook: " + err.message);
        }
        return notebook;
    }

    async serializeNotebook(data: vscode.NotebookData, _token: vscode.CancellationToken): Promise<Uint8Array> {
        let contents: RawNotebookCell[] = [];

        this.validateNotebook(data);

        for (const cell of data.cells) {
            contents.push({
                kind: cell.kind,
                language: cell.languageId,
                value: cell.value
            });
        }

        return new TextEncoder().encode(JSON.stringify(contents));
    }

    private validateNotebook(data: vscode.NotebookData) {
        const tomlCells = data.cells.filter(c => c.languageId == Constants.LANGUAGE_TOML);
        if (tomlCells.length !== 1) {
            throw new Error("The notebook needs to have one TOML config. For more details, look at documentation");
        }
        const configParsed = toml.parse(tomlCells[0].value);
        const contractUrl: string = configParsed.config["contract-url"];
        if (!contractUrl || contractUrl.trim().length == 0) {
            throw new Error("config.contract-url is not provided in TOML config");
        }
        const schemaUrl: string = configParsed.config["schema-url"];
        if (!schemaUrl || schemaUrl.trim().length == 0) {
            throw new Error("config.schema-url is not provided in TOML config");
        }
    }
}

