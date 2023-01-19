import * as vscode from 'vscode';
import { Executer } from '../helpers/cosmwasm/executer';
import { Action, History, HistoryHandler } from '../helpers/extensionData/historyHandler';
import { Workspace } from '../helpers/workspace';
import { Contract } from '../models/contract';

export class CosmwasmHistoryView {

    private history: History[]
    private contracts: Contract[];
    private executer: Executer;

    constructor(private readonly context: vscode.Memento) {
        this.history = HistoryHandler.GetHistory(this.context).reverse();
        this.contracts = Contract.GetContracts(this.context);
        this.executer = new Executer(context, false);
    }

    public getWebviewContent(extensionUri: vscode.Uri, webview: vscode.Webview) {

        const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'reset.css'));
        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'vscode.css'));
        const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'main.css'));

        webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'exec': {
                    const action = this.history[data.value];
                    const contract = this.getContract(action);
                    if (contract) {
                        Workspace.SetSelectedContract(contract);
                        switch (action.actionType) {
                            case Action.Query: {
                                this.executer.Query(action.inputData, vscode.ProgressLocation.Notification);
                                break;
                            }
                            case Action.Tx: {
                                this.executer.Execute(action.inputData, vscode.ProgressLocation.Notification)
                                break;
                            }
                            default: { }
                        }
                    }
                    else {
                        vscode.window.showErrorMessage(vscode.l10n.t("Contract not found in imported contracts. Try importing the address again and running the query"));
                    }
                    break;
                };
                case 'clear': {
                    HistoryHandler.ClearHistory(this.context);
                    vscode.window.showInformationMessage(vscode.l10n.t("Successfully deleted the CosmWasm history. Reopen the page."));
                    break;
                }
                case 'export': {
                    vscode.commands.executeCommand('cosmy-wasmy.export').then(() => {
                    });
                    break;
                }
            }
        })

        webview.html = this.getWebview(webview, styleResetUri, styleVSCodeUri, styleMainUri);
        return
    }

    private getWebview(webview: vscode.Webview, styleResetUri: vscode.Uri, styleVSCodeUri: vscode.Uri, styleMainUri: vscode.Uri): string {
        return `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta http-equiv="Content-Security-Policy" style-src ${webview.cspSource};">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="${styleResetUri}" rel="stylesheet">
          <link href="${styleVSCodeUri}" rel="stylesheet">
          <link href="${styleMainUri}" rel="stylesheet">
          <title>Cosmwasm History</title>
      </head>
      <body>
      ${this.getViewContent()}
      <script>
      (function () {
          const vscode = acquireVsCodeApi();
          function post(e) {
              vscode.postMessage({ type: 'exec', value: e.target.id });
          }
          function clearHistory(e) {
            vscode.postMessage({ type: 'clear', value: e.target.id });
          }
          function exportHistory(e) {
            vscode.postMessage({ type: 'export', value: e.target.id });
          }

          var buttonArray = document.getElementsByClassName('tertiary');
          for(i = 0; i < buttonArray.length; i++)
          {
              if (document.addEventListener) {
                  buttonArray[i].addEventListener("click", post);
              } 
              else { 
                  if (document.attachEvent) {
                      buttonArray[i].attachEvent("onclick", post);
                  }
              }
          }

          var clearBtn = document.getElementById('clear-btn');
          var exportBtn = document.getElementById('export-btn');
          if (document.addEventListener) {
            clearBtn.addEventListener("click", clearHistory);
            exportBtn.addEventListener("click", exportHistory);
          } 
          else { 
              if (document.attachEvent) {
                clearBtn.attachEvent("onclick", clearHistory);
                exportBtn.attachEvent("onclick", exportHistory);
              }
          }
      }());
      </script>
      </body>
      </html>`;
    }

    private getViewContent() {
        let content = "";
        if (Workspace.GetCosmwasmQueriesStored() < 1) {
            content += `<p>The "cosmywasmy.maxHistoryStored" setting is set to zero. Therefore, no query/tx is recorded. Enable that setting to keep history of recorded queries and txs to rerun them easily.</p>`
        }
        else if (this.history.length < 1) {
            content += "The history seems to be empty. Run some queries and txs to record history."
        } else {
            content += `<div style="overflow-x:auto;">      
            <table>
            <tr>
                <th class="line-num">#</th>
                <th>Run</th>
                <th>Type</th>
                <th>Label</th>
                <th>Input Data</th>
                <th>Input Funds</th>
                <th>Contract Address</th>
            </tr>`;
            content += this.getTableData();
            content += "</table></div><br />";
            content += `<div style="margin:auto; width: 100%; text-align: center;">
                <button id="clear-btn" class="secondary" style="padding: 0.7rem; width: 49%;">` + vscode.l10n.t("Clear History") + `</button>  
                <button id="export-btn" class="secondary" style="padding: 0.7rem; width: 49%;">` + vscode.l10n.t("Export History as JSON") + `</button>
            </div><br />`;
        }
        return content;
    }

    private getTableData() {
        let tableContent = "";

        this.history.forEach((item, i) => {
            let inputData = item.inputData;
            let inputFunds = "";
            const data = JSON.parse(JSON.stringify(item.inputData));
            if (data.input) {
                inputData = data.input;
            }
            if (data.funds) {
                inputFunds = data.funds;
            }

            tableContent += "<tr>";
            tableContent += "<td class=\"line-num\">" + i + "</td>";
            tableContent += "<td><button id=\"" + i + "\" class=\"tertiary\">▶</button></td>";
            tableContent += "<td>" + Action[item.actionType] + "</td>";
            const contract = this.getContract(item);
            if (contract) {
                tableContent += "<td>" + contract.codeId + ": " + contract.label + "</td>";
            }
            else {
                tableContent += "<td><span class=\"error\"><i>" + vscode.l10n.t("Contract not found in imported contracts.") + "</i></span></td>";
            }
            tableContent += "<td>" + inputData + "</td>";
            tableContent += "<td>" + inputFunds + "</td>";
            tableContent += "<td>" + item.contractAddr + "</td>";
            tableContent += "</tr>";
        });
        return tableContent;
    }

    private getContract(action: History): Contract | undefined {
        const contracts = this.contracts.filter(c => c.contractAddress === action.contractAddr);
        if (contracts && contracts.length > 0) {
            return contracts[0];
        }
        else {
            return undefined;
        }
    }
}

// run; codiId + contract label; contract addr; queryType; input data;