import * as vscode from 'vscode';

export class CosmwasmTerminal {

    private _terminal!: vscode.Terminal;
    private static _channel: vscode.OutputChannel;

    constructor() {
    }

    private get terminal(): vscode.Terminal {
        if (!this._terminal) {
            let terminals = vscode.window.terminals.filter(t => t.name === "Cosmwasm")
            if (terminals.length > 0) {
                this._terminal = terminals[0];
            }
            else {
                this._terminal = vscode.window.createTerminal({
                    hideFromUser: true,
                    location: vscode.TerminalLocation.Panel,
                    name: "Cosmwasm",
                    message: "Cosmwasm terminal - created by Cosmy Wasmy ⚛️"
                });
            }
        }
        return this._terminal;
    }
    private set terminal(value: vscode.Terminal) {
        this._terminal = value;
    }

    private static get channel(): vscode.OutputChannel {
        if (!this._channel) {
            this._channel = vscode.window.createOutputChannel("Cosmwasm", "jsonc");
        }
        return this._channel;
    }

    private static set channel(value: vscode.OutputChannel) {
        this._channel = value;
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

    public static output(outputText: string) {
        this.channel.appendLine(outputText);
        this.channel.show();
    }

    private execute(text: string) {
        this.terminal.show();
        this.terminal.sendText(text, true);
    }

}