import { TextEncoder } from 'util';
import * as vscode from 'vscode';
var toml = require('toml');

export class FileWatcher {
    public static async Register() {
        const contractName = await getContractName();
        const schemaFile = "schema/" + contractName + ".json";
        const pattern = new vscode.RelativePattern(vscode.workspace.workspaceFolders[0], schemaFile);
        global.schemaFileWatch = vscode.workspace.createFileSystemWatcher(pattern, false, false, true);
        global.schemaFileWatch.onDidChange(() => {
            generateSchemaFiles();
        });
        global.schemaFileWatch.onDidCreate(() => {
            generateSchemaFiles();
        });

        function generateSchemaFiles() {
            // executing after 6 secs cuz when event is hit, the file contents are still old 👎🏻
            // normal text change and save works fine, but the cargo schema updating the contract.json seems to not show updated file
            setTimeout(async function () {
                const contractName = await getContractName();
                const schemaUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, "schema", contractName + ".json");
                const doc = await vscode.workspace.openTextDocument(schemaUri);
                const schema = JSON.parse(doc.getText());

                generateInstantiateSchema(schema);
                generateQuerySchema(schema);
                generateExecuteSchema(schema);
                if (schema.migrate) {
                    generateMigrateSchema(schema);
                }
                if (schema.sudo) {
                    generateSudoSchema(schema);
                }

                function generateInstantiateSchema(schema: any) {
                    const instantiateSchemaFile = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, "schema", "instantiate_msg.json");
                    saveSchemaFile(schema.instantiate, instantiateSchemaFile);
                }

                function generateQuerySchema(schema: any) {
                    const querySchemaFile = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, "schema", "query_msg.json");
                    saveSchemaFile(schema.query, querySchemaFile);
                }

                function generateExecuteSchema(schema: any) {
                    const executeSchemaFile = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, "schema", "execute_msg.json");
                    saveSchemaFile(schema.execute, executeSchemaFile);
                }

                function generateMigrateSchema(schema: any) {
                    const executeMigrateFile = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, "schema", "migrate_msg.json");
                    saveSchemaFile(schema.migrate, executeMigrateFile);
                }

                function generateSudoSchema(schema: any) {
                    const sudoSchemaFile = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, "schema", "sudo_msg.json");
                    saveSchemaFile(schema.sudo, sudoSchemaFile);
                }

                function saveSchemaFile(schema: any, schemaFile: vscode.Uri) {
                    vscode.workspace.fs.writeFile(schemaFile, new TextEncoder().encode(JSON.stringify(schema)));
                }
            }, 6000);
        }
    }
}

async function getContractName() {
    const cargoToml = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, "Cargo.toml");
    const doc = await vscode.workspace.openTextDocument(cargoToml);
    const cargo = toml.parse(doc.getText());
    const contractName = cargo.package.name;
    return contractName;
}