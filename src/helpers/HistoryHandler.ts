import * as vscode from 'vscode';
import { Constants } from '../constants';
import { Contract } from '../models/Contract';
import { ExtData } from './ExtData';
import { Workspace } from './Workspace';

export class HistoryHandler {

    public static GetHistory(context: vscode.Memento): History[] {
        return ExtData.GetExtensionData(context).history ?? [];
    }

    public static RecordAction(context: vscode.Memento, contract: Contract, view: String, input: string) {
        if (Workspace.GetCosmwasmQueriesStored() > 0) {
            let actionType: Action = Action.Invalid;
            switch (view) {
                case Constants.VIEWS_QUERY: actionType = Action.Query; break;
                case Constants.VIEWS_EXECUTE: actionType = Action.Tx; break;
                case Constants.VIEWS_MIGRATE: actionType = Action.Migrate; break;
                case Constants.VIEWS_INITIALIZE: actionType = Action.Initialize; break;
            }
            let history = new History(contract.contractAddress, actionType, input);

            HistoryHandler.SaveHistory(context, history);
            return;
        }
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

enum Action {
    Query,
    Tx,
    Migrate,
    Initialize,
    Invalid
}