import * as vscode from 'vscode';
import { Cosmwasm } from '../helpers/CosmwasmAPI';
import { Action, History, HistoryHandler } from '../helpers/HistoryHandler';
import { Workspace } from '../helpers/Workspace';
import { Contract } from '../models/Contract';

export class CosmwasmHistoryView {

    private history: History[]
    private contracts: Contract[];

    constructor(private readonly context: vscode.Memento) {
        this.history = HistoryHandler.GetHistory(this.context).reverse();
        this.contracts = Contract.GetContracts(this.context);
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
                        switch (action.actionType) {
                            case Action.Query: {
                                vscode.window.withProgress({
                                    location: vscode.ProgressLocation.Notification,
                                    title: "Querying the contract - " + contract.label,
                                    cancellable: false
                                }, (progress, token) => {
                                    token.onCancellationRequested(() => { });
                                    progress.report({ message: '' });
                                    return new Promise(async (resolve, reject) => {
                                        let data = JSON.parse(action.inputData);
                                        await Cosmwasm.Query(contract, data, resolve, reject);
                                    });
                                });
                                break;
                            }
                            case Action.Tx: {
                                const account = Workspace.GetSelectedAccount();
                                if (!account) {
                                    vscode.window.showErrorMessage("No account selected. Select an account from the Accounts view.");
                                    return;
                                }
                                vscode.window.withProgress({
                                    location: vscode.ProgressLocation.Notification,
                                    title: "Executing msg on the contract - " + contract.label,
                                    cancellable: false
                                }, (progress, token) => {
                                    token.onCancellationRequested(() => { });
                                    progress.report({ message: '' });
                                    return new Promise(async (resolve, reject) => {
                                        let data = JSON.parse(action.inputData);
                                        await Cosmwasm.Execute(account, contract, data, resolve, reject);
                                    });
                                });
                                break;
                            }
                            default: {

                            }
                        }
                    }
                    else {
                        vscode.window.showErrorMessage("Contract not found in imported contracts. Try importing the address again and running the query");
                    }

                }
            }
        })

        webview.html = `<!DOCTYPE html>
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
      }());
      </script>
      </body>
      </html>`;
        return
    }

    private getViewContent() {
        let content = "";
        if (Workspace.GetCosmwasmQueriesStored() < 1) {
            content += `<p>The "cosmywasmy.maxQueryStored" setting is set to zero. Therefore, no query/tx is recorded. Enable that setting to keep history of recorded queries and txs to rerun them easily.</p>`
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
              <th>Contract Address</th>
          </tr>`;
            content += this.getTableData();
            content += "</table></div>"
        }
        return content;
    }

    private getTableData() {
        let tableContent = "";

        this.history.forEach((item, i) => {
            tableContent += "<tr>";
            tableContent += "<td class=\"line-num\">" + i + "</td>";
            tableContent += "<td><button id=\"" + i + "\" class=\"tertiary\">▶</button></td>";
            tableContent += "<td>" + Action[item.actionType] + "</td>";
            const contract = this.getContract(item);
            if (contract) {
                tableContent += "<td>" + contract.codeId + ": " + contract.label + "</td>";
            }
            else {
                tableContent += "<td><span class=\"error\"><i>Contract not found in imported contracts.</i></span></td>";
            }
            tableContent += "<td>" + item.inputData + "</td>";
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