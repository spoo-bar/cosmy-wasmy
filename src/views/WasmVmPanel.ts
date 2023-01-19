import * as vscode from "vscode";
import { CWSimulateApp } from '@terran-one/cw-simulate';
import { parseCoins } from "@cosmjs/launchpad";


export class WasmVmPanel {
    public static currentPanel: WasmVmPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private readonly _wasmBinary: Uint8Array;
    private readonly _app: CWSimulateApp;
    private readonly _codeId: number;

    constructor(panel: vscode.WebviewPanel, wasm: Uint8Array) {
        this._panel = panel;
        this._wasmBinary = wasm;
        this._app = new CWSimulateApp({
            chainId: 'cosmy-wasmy-1',
            bech32Prefix: 'test'
        });
        this._codeId = this._app.wasm.create('', this._wasmBinary);

        this._setWebviewMessageListener(this._panel.webview);
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    public async getWebviewContent(extensionUri: vscode.Uri) {
        const toolkitUri = this.getUri(this._panel.webview, extensionUri, [
            "node_modules",
            "@vscode",
            "webview-ui-toolkit",
            "dist",
            "toolkit.min.js", // A toolkit.min.js file is also available
        ]);
        const mainUri = this.getUri(this._panel.webview, extensionUri, ["media", "wasm-vm.js"]);
        const contractName = this._panel.title;

        this._panel.webview.html = /*html*/ `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width,initial-scale=1.0">
            <script type="module" src="${toolkitUri}"></script>
            <script type="module" src="${mainUri}"></script>
            <title>${contractName}</title>
          </head>
          <body>
            <h1>${contractName}</h1>
            <h3>${vscode.l10n.t("Simulating in CosmWasm VM")}</h3>
            <vscode-divider></vscode-divider>
            <vscode-panels aria-label="Default">
                <vscode-panel-tab id="tab-1">${vscode.l10n.t("SETUP")}</vscode-panel-tab>
                <vscode-panel-tab id="tab-2">${vscode.l10n.t("CONTRACTS")}</vscode-panel-tab>
                <vscode-panel-view id="view-1">
                <vscode-text-field disabled value="${this._app.chainId}" style="margin-right:20px;">${vscode.l10n.t("Chain ID")}</vscode-text-field> 
                <vscode-text-field disabled value="${this._app.bech32Prefix}" size="5">${vscode.l10n.t("Chain Prefix")}</vscode-text-field>
                </vscode-panel-view>
                <vscode-panel-view id="view-2">
                <vscode-data-grid id="contracts-grid" grid-template-columns="5% 20% 75%" aria-label="Default"></vscode-data-grid>
                </vscode-panel-view>
            </vscode-panels>
            <br />
            <vscode-divider></vscode-divider>
            <br />
            <vscode-panels activeid="tab-3" aria-label="Default">
                <vscode-panel-tab id="tab-1">${vscode.l10n.t("EXECUTE")}</vscode-panel-tab>
                <vscode-panel-tab id="tab-2">${vscode.l10n.t("QUERY")}</vscode-panel-tab>
                <vscode-panel-tab id="tab-3">${vscode.l10n.t("INSTANTIATE")}</vscode-panel-tab>
                <vscode-panel-view id="view-1">
                    <vscode-text-field id="executeContractAddr" placeholder="test1f44ddca9awepv2rnudztguq5rmrran2m20zzd6" size="50">${vscode.l10n.t("Contract Address")}</vscode-text-field> 
                    <vscode-text-field id="executeSenderAddr" placeholder="test1f44ddca9awepv2rnudztguq5rmrran2m20zzd6" size="42" style="margin-left:20px;">${vscode.l10n.t("Sender Address")}</vscode-text-field> 
                    <vscode-text-field id="executeFunds" placeholder="10utokenx" style="margin-left:20px;" size="8">${vscode.l10n.t("Funds")}</vscode-text-field> 
                    <vscode-text-area id="executeInput" style="margin-left:20px;" cols="30" placeholder="{'count': 6}">${vscode.l10n.t("Input")}</vscode-text-area>
                    <vscode-button id="executeBtn" style="margin:1.5rem;">${vscode.l10n.t("Execute")}</vscode-button>
                </vscode-panel-view>
                <vscode-panel-view id="view-2">
                    <vscode-text-field id="queryContractAddr" placeholder="test1f44ddca9awepv2rnudztguq5rmrran2m20zzd6" size="42">${vscode.l10n.t("Contract Address")}</vscode-text-field> 
                    <vscode-text-area id="queryInput" style="margin-left:20px;" cols="30" placeholder="{'count': 6}">${vscode.l10n.t("Input")}</vscode-text-area>
                    <vscode-button id="queryBtn" style="margin:1.5rem;">${vscode.l10n.t("Query")}</vscode-button>
                    </vscode-panel-view>
                <vscode-panel-view id="view-3">
                    <vscode-text-field id="instantiateSenderAddr" placeholder="test1f44ddca9awepv2rnudztguq5rmrran2m20zzd6" size="42">${vscode.l10n.t("Sender Address")}</vscode-text-field> 
                    <vscode-text-field id="instantiateLabel" placeholder="Counter v0.1" style="margin-left:20px;">${vscode.l10n.t("Contract Label")}</vscode-text-field> 
                    <vscode-text-field id="instantiateFunds" placeholder="10utokenx" style="margin-left:20px;" size="8">${vscode.l10n.t("Funds")}</vscode-text-field> 
                    <vscode-text-area id="instantiateInput" style="margin-left:20px;" cols="30" placeholder="{'count': 6}">${vscode.l10n.t("Input")}</vscode-text-area>
                    <vscode-button id="instantiateBtn" style="margin:1.5rem;">${vscode.l10n.t("Instantiate")}</vscode-button>
            </vscode-panel-view>
            </vscode-panels>
            <vscode-text-area id="response" style="width: 90%" disabled>${vscode.l10n.t("Response")}</vscode-text-area>
            <br />
                <vscode-divider></vscode-divider>
            <br />
            <vscode-panels aria-label="Default">
                <vscode-panel-tab id="tab-1">${vscode.l10n.t("LOG")}</vscode-panel-tab>
                <vscode-panel-view id="view-1">
                <vscode-data-grid id="vm-responses-grid" aria-label="Default" grid-template-columns="5% 5% 20% 35% 35%"></vscode-data-grid>
                </vscode-panel-view>
            </vscode-panels>
          </body>
        </html>
      `;
        return;
    }

    private _setWebviewMessageListener(webview: vscode.Webview) {
        webview.onDidReceiveMessage(
            async (message: any) => {
                const command = message.command;
                const value = message.value;

                switch (command) {
                    case "instantiate":
                        await this.initializeContract(value);
                        return;
                    case "execute":
                        await this.executeContract(value);
                        return;
                    case "query":
                        await this.queryContract(value);
                        return;
                }
            },
            undefined,
            this._disposables
        );
    }

    private async initializeContract(value: any) {
        let funds = parseCoins(value.funds);
        let input = JSON.parse(value.input);
        let result = await this._app.wasm.instantiateContract(value.senderAddr, funds, this._codeId, input, value.label);
        this._panel.webview.postMessage({ command: 'instantiate-res', value: result });
        if (result.ok && typeof result.val !== 'string') {
            const contractAddress = result.val.events[0].attributes[0].value;
            this._panel.webview.postMessage({
                command: 'append-contract', value: {
                    label: value.label,
                    address: contractAddress
                }
            });
        }
    }

    private async executeContract(value: any) {
        let funds = parseCoins(value.funds);
        let input = JSON.parse(value.input);
        let result = await this._app.wasm.executeContract(value.senderAddr, funds, value.ContractAddr, input);
        this._panel.webview.postMessage({ command: 'execute-res', value: result });
    }

    private async queryContract(value: any) {
        let input = JSON.parse(value.input);
        let result = await this._app.wasm.query(value.ContractAddr, input);
        this._panel.webview.postMessage({ command: 'query-res', value: result });
    }

    private getUri(webview: vscode.Webview, extensionUri: vscode.Uri, pathList: string[]) {
        return webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, ...pathList));
    }

    public dispose() {
        WasmVmPanel.currentPanel = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}