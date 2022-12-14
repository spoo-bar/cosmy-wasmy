import * as vscode from 'vscode';
import { Contract } from '../../models/contract';
import { ExtData } from './extData';
import { Workspace } from '../workspace';

export class HistoryHandler {

    public static GetHistory(context: vscode.Memento): History[] {
        return ExtData.GetExtensionData(context).history ?? [];
    }

    public static RecordAction(context: vscode.Memento, contract: Contract, action: Action, input: string) {
        if (Workspace.GetCosmwasmQueriesStored() > 0) {
            let history = new History(contract.contractAddress, action, input);

            HistoryHandler.SaveHistory(context, history);
            return;
        }
    }

    public static ClearHistory(context: vscode.Memento) {
        ExtData.SaveHistory(context, []);
    }

    private static SaveHistory(context: vscode.Memento, history: History) {
        let histories = this.GetHistory(context);
        histories.push(history);
        const maxCount = Workspace.GetCosmwasmQueriesStored();
        histories = histories.slice(-1 * maxCount);
        ExtData.SaveHistory(context, histories);
    }
}

export class History {
    contractAddr: string;
    actionType: Action;
    inputData: string;


    constructor(contract: string, actionType: Action, inputData: string) {
        this.contractAddr = contract;
        this.actionType = actionType;
        this.inputData = inputData;
    }
}

export enum Action {
    Query,
    Tx,
    Migrate,
    Initialize,
    Invalid
}