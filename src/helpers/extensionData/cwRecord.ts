import { TextDecoder, TextEncoder } from 'util';
import * as vscode from 'vscode';
import { Account } from '../../models/account';
import { Contract } from '../../models/contract';
import { ChainConfig, Workspace } from '../workspace';

export class CWRecord {

    public static RecordInteraction(input: {data: string, timestamp: Date}, output: {data: string, timestamp: Date}) {
        let interaction = new Interaction();
        interaction.account = Workspace.GetSelectedAccount();
        interaction.contract = Workspace.GetSelectedContract();
        interaction.chainConfig = global.workspaceChain;
        interaction.input = input;
        interaction.output = output;
        this.SaveInteraction(interaction);
    }

    private static async SaveInteraction(interaction: Interaction) {
        const fileUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, "cw.json")
        let readBuffer = await vscode.workspace.fs.readFile(fileUri);
        let fileContent = new TextDecoder().decode(readBuffer);
        let records: Interaction[] = JSON.parse(fileContent)
        records.push(interaction);
        let outBuff = new TextEncoder().encode(JSON.stringify(records));
        await vscode.workspace.fs.writeFile(fileUri, outBuff);
    }
}

class Interaction {
    account: Account;
    contract: Contract;
    chainConfig: ChainConfig;
    input: {
        data: string,
        timestamp: Date,
    };
    output: {
        data: string,
        timestamp: Date,
    };
}
