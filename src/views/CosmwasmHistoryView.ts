import * as vscode from 'vscode';
import { Action, History } from '../helpers/HistoryHandler';
import { Contract } from '../models/Contract';

export class CosmwasmHistoryView {
    public static getWebviewContent(extensionUri: vscode.Uri, webview: vscode.Webview, history: History[], contracts: Contract[]) {

        const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'reset.css'));
        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'vscode.css'));
        const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'main.css'));

        let tableContent = "";
        history.forEach((item, i) => {
            tableContent += "<tr>";
            tableContent += "<td class=\"line-num\">" + i + "</td>";
            const contract = contracts.filter(c => c.contractAddress === item.contractAddr);
            if (contract && contract.length > 0) {
                tableContent += "<td>" + contract[0].codeId + ": " + contract[0].label + "</td>";
            }
            else {
                tableContent += "<td><span class=\"error\"><i>Contract address not found in imported contracts.</i></span></td>";
            }
            tableContent += "<td>" + item.contractAddr + "</td>";
            tableContent += "<td>" + Action[item.actionType] + "</td>";
            tableContent += "<td>" + item.inputData + "</td>";
            tableContent += "<td><button class=\"tertiary\">▶️</button></td>";
            tableContent += "</tr>";
        })

        webview.html = `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="${styleResetUri}" rel="stylesheet">
          <link href="${styleVSCodeUri}" rel="stylesheet">
          <link href="${styleMainUri}" rel="stylesheet">
          <title>Cosmwasm History</title>
      </head>
      <body>
      <div style="overflow-x:auto;">
      <table>
        <tr>
            <th class="line-num">#</th>
            <th>Name</th>
            <th>Contract Address</th>
            <th>Query Type</th>
            <th>Input Data</th>
            <th>Run</th>
        </tr>
        ${tableContent}
        </table>
        </div>
      </body>
      </html>`;
        return
    }
}

// run; codiId + contract label; contract addr; queryType; input data;