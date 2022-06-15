import * as vscode from 'vscode';
import { Constants } from '../constants';
import { Contract } from '../models/Contract';


export class ContractDataProvider implements vscode.TreeDataProvider<Contract> {

	private contracts: Contract[];

	/**
	 *
	 */
	constructor(contracts: Contract[]) {
		this.contracts = contracts;
	}

	private _onDidChangeTreeData: vscode.EventEmitter<void | Contract | Contract[] | null | undefined> = new vscode.EventEmitter<void | Contract | Contract[] | null | undefined>();
	readonly onDidChangeTreeData: vscode.Event<void | Contract | Contract[] | null | undefined> = this._onDidChangeTreeData.event;


	refresh(contracts: Contract[]): void {
		this.contracts = contracts;
		this._onDidChangeTreeData.fire(undefined);
	}

	getTreeItem(contract: Contract): vscode.TreeItem | Thenable<vscode.TreeItem> {
		contract.id = contract.contractAddress.toString();
		contract.label = contract.codeId.toString() + ": " + contract.label;
		contract.description = contract.contractAddress;
		contract.tooltip = "Creator: " + contract.creator;
		contract.contextValue = Constants.VIEWS_CONTRACT;
		contract.command = {
			title: "Select Contract",
			command: "cosmy-wasmy.selectContract",
			arguments: [contract]
		};
		return contract;
	}

	getChildren(element?: Contract): vscode.ProviderResult<Contract[]> {
		if (!element) {
			const contracts = this.contracts;
			return contracts;
		}
	}

}
