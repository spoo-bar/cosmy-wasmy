import * as vscode from 'vscode';

export class CosmwasmTerminal {

    private extensionUri: vscode.Uri;
    private _terminal!: vscode.Terminal;

    constructor(context: vscode.ExtensionContext) {
        this.extensionUri = context.extensionUri
    }
    
    private get terminal(): vscode.Terminal {
        if(!this._terminal) {
            let terminals = vscode.window.terminals.filter(t => t.name === "Cosmwasm" )
            if (terminals.length > 0) {
                this._terminal = terminals[0];
            }
            else {
                this._terminal = vscode.window.createTerminal({
                    hideFromUser: true,
                    location: vscode.TerminalLocation.Panel,
                    name: "Cosmwasm",
                    message: "Cosmwasm terminal - created by Cosmy Wasmy ⚛️",
                    iconPath: vscode.Uri.joinPath(this.extensionUri, 'media', 'icon.svg')
                });
            }
        }
        return this._terminal;
    }
    private set terminal(value: vscode.Terminal) {
        this._terminal = value;
    }  


    public build() {
        this.execute("cargo wasm");
    }

    public unitTests() {
        this.execute("cargo unit-test");
    }

    public optimize() {
        this.execute("cargo run-script optimize");
    }

    public schema() {
        this.execute("cargo schema")
    }

    public setupDevEnv() {
        this.execute("rustup default stable")
        this.execute("cargo version")
        this.execute("rustup update stable")
        this.execute("rustup target list --installed")
        this.execute("rustup target add wasm32-unknown-unknown")
        this.execute("cargo install cargo-run-script")
        //this.execute("cargo install cargo-generate --features vendored-openssl")
    }

    private execute(text: string) {
        this.terminal.show();
        this.terminal.sendText(text, true);
    }

}