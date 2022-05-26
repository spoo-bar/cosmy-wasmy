import * as vscode from 'vscode';
import { ExtData } from './ExtData';


export class Contract extends vscode.TreeItem {
    label: string;
    contractAddress: string;
    codeId: number;
    creator: string;

    /**
     *
     */
    constructor(id: string, contract: string, codeId: number, creator: string) {
        super(id);
        this.label = id;
        this.contractAddress = contract;
        this.codeId = codeId;
        this.creator = creator;
    }

    public static GetContracts(context: vscode.Memento): Contract[] {
        return ExtData.GetExtensionData(context).contracts;
    }

    public static AddContract(context: vscode.Memento, contract: Contract) {
        let contracts = this.GetContracts(context);
		contracts.push(contract);
		ExtData.SaveContracts(context, contracts);
    }
}


