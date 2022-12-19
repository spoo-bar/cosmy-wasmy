import * as vscode from "vscode";

export class WasmVmPanel {
    public static currentPanel: WasmVmPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
        this._setWebviewMessageListener(this._panel.webview);
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    public static render(extensionUri: vscode.Uri, wasm: vscode.Uri) {
        if (WasmVmPanel.currentPanel) {
            WasmVmPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
        } else {
            const panel = vscode.window.createWebviewPanel("hello-world", "Hello World", vscode.ViewColumn.One, {
                enableScripts: true,
            });

            WasmVmPanel.currentPanel = new WasmVmPanel(panel, extensionUri);
        }
    }

    private _setWebviewMessageListener(webview: vscode.Webview) {
        webview.onDidReceiveMessage(
          (message: any) => {
            const command = message.command;
            const text = message.text;
    
            switch (command) {
              case "hello":
                vscode.window.showInformationMessage(text);
                return;
            }
          },
          undefined,
          this._disposables
        );
      }

    private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
        const toolkitUri = this.getUri(webview, extensionUri, [
            "node_modules",
            "@vscode",
            "webview-ui-toolkit",
            "dist",
            "toolkit.js", // A toolkit.min.js file is also available
        ]);

        const mainUri = this.getUri(webview, extensionUri, ["media", "wasm-vm.js"]);

        return /*html*/ `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width,initial-scale=1.0">
            <script type="module" src="${toolkitUri}"></script>
            <script type="module" src="${mainUri}"></script>
            <title>Hello World!</title>
          </head>
          <body>
            <h1>counter.json</h1>
            <h3>Simulating in CosmWasm VM</h3>
            <vscode-divider></vscode-divider>
            <vscode-panels aria-label="Defalt">
                <vscode-panel-tab id="tab-1">SETUP</vscode-panel-tab>
                <vscode-panel-view id="view-1">
                <vscode-text-field placeholder="321" style="margin-right:20px;">Code ID</vscode-text-field> 
                <vscode-text-field placeholder="juno1kpjz6jsyxg0wd5r5hhyquawgt3zva34msdvwue" size="50">Contract Address</vscode-text-field>
                <br />
                <vscode-button id="howdy" style="margin:1rem;">Howdy!</vscode-button>
                </vscode-panel-view>
            </vscode-panels>
            <br />
            <vscode-divider></vscode-divider>
            <br />
            <vscode-panels activeid="tab-3" aria-label="Default">
                <vscode-panel-tab id="tab-1">EXECUTE</vscode-panel-tab>
                <vscode-panel-tab id="tab-2">QUERY</vscode-panel-tab>
                <vscode-panel-tab id="tab-3">INSTANTIATE</vscode-panel-tab>
                <vscode-panel-view id="view-1">
                    <vscode-text-field placeholder="juno1f44ddca9awepv2rnudztguq5rmrran2m20zzd6" size="42">Sender Address</vscode-text-field> 
                    <vscode-text-field placeholder="10ujunox" style="margin-left:20px;" size="8">Funds</vscode-text-field> 
                    <vscode-text-area style="margin-left:20px;" cols="30" placeholder="{'count': 6}">Text Area Label</vscode-text-area>
                    <vscode-button style="margin:1.5rem;">Execute</vscode-button>
                </vscode-panel-view>
                <vscode-panel-view id="view-2">
                    <vscode-text-field placeholder="juno1f44ddca9awepv2rnudztguq5rmrran2m20zzd6" size="42">Sender Address</vscode-text-field> 
                    <vscode-text-area style="margin-left:20px;" cols="30" placeholder="{'count': 6}">Text Area Label</vscode-text-area>
                    <vscode-button style="margin:1.5rem;">Query</vscode-button>
                </vscode-panel-view>
                <vscode-panel-view id="view-3">
                    <vscode-text-field placeholder="juno1f44ddca9awepv2rnudztguq5rmrran2m20zzd6" size="42">Sender Address</vscode-text-field> 
                    <vscode-text-field placeholder="10ujunox" style="margin-left:20px;" size="8">Funds</vscode-text-field> 
                    <vscode-text-area style="margin-left:20px;" cols="30" placeholder="{'count': 6}">Text Area Label</vscode-text-area>
                    <vscode-button style="margin:1.5rem;">Instantiate</vscode-button>
            </vscode-panel-view>
            </vscode-panels>
            <br />
                <vscode-divider></vscode-divider>
            <br />
            <vscode-panels aria-label="Default">
                <vscode-panel-tab id="tab-1">LOG</vscode-panel-tab>
                <vscode-panel-tab id="tab-2">STATE</vscode-panel-tab>
                <vscode-panel-view id="view-1">
                <vscode-data-grid id="basic-grid" aria-label="Default"></vscode-data-grid>
                </vscode-panel-view>
                <vscode-panel-view id="view-2">
                <vscode-text-area>Text Area Label</vscode-text-area>
                </vscode-panel-view>
            </vscode-panels>
          </body>
        </html>
      `;
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