import * as vscode from 'vscode';
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

	getTreeItem(element: Contract): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return element;
	}

	getChildren(element?: Contract): vscode.ProviderResult<Contract[]> {
		if (!element) {
			const contracts = this.contracts;
			return Promise.resolve(new Promise(function (resolve, reject) {
				if (contracts && contracts.length > 0) {
					contracts.forEach(contract => {
						contract.id = contract.codeId.toString();
						contract.label = contract.codeId.toString() + ": " + contract.label;
						contract.description = contract.contractAddress;
						contract.tooltip = "Creator: " + contract.creator;
						contract.contextValue = "contract";
						contract.command = {
							title: "Select Contract",
							command: "cosmy-wasmy.selectContract",
							arguments: [contract]
						};
					});
				};
				resolve(contracts);
			}));
		}
	}

}
