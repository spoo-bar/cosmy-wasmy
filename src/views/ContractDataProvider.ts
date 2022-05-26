import * as vscode from 'vscode';
import { Contract } from '../models/Contract';


export class ContractDataProvider implements vscode.TreeDataProvider<Contract> {
	
	private changeEvent = new vscode.EventEmitter<void>();

		private _onDidChangeTreeData: vscode.EventEmitter<void | Contract | Contract[] | null | undefined> = new vscode.EventEmitter<void | Contract | Contract[] | null | undefined>();
		/**
	 *
	 */
	constructor(contracts: Contract[]) {
		this.contracts = contracts;
	}
	
	public contracts: Contract[];

	public get onDidChangeTreeData(): vscode.Event<void> {
        return this.changeEvent.event;
    }

    refresh(data: void | Contract | Contract[] | null | undefined): void {
		vscode.window.showInformationMessage("refreshing")
        this._onDidChangeTreeData.fire(data);
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
