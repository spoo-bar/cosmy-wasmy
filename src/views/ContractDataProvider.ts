import * as vscode from 'vscode';
import { Constants } from '../constants';
import { Contract } from '../models/Contract';
import { ContractSortOrder, Workspace } from '../models/Workspace';


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
		switch (Workspace.GetContractSortOrder()) {

			case ContractSortOrder.Alphabetical: { formatContractViewItem(); }
			break;

			case ContractSortOrder.CodeId: {
				if (contract.contractAddress) { formatContractViewItem(); }
				else { formatContractCodeViewItem(); }
			}
			break;

			case ContractSortOrder.None:
			default: { formatContractViewItem(); }
			break;
		}
		return contract;

		function formatContractViewItem() {
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
		}

		function formatContractCodeViewItem() {
			contract.id = contract.codeId.toString();
			contract.label = "Code: " + contract.codeId.toString();
			contract.description = "";
			contract.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
		}
	}

	getChildren(element?: Contract): vscode.ProviderResult<Contract[]> {
		switch (Workspace.GetContractSortOrder()) {
			case ContractSortOrder.Alphabetical: { if (!element) { return this.contracts.sort((c1, c2) => 
				(c1.label.toLowerCase() > c2.label.toLowerCase()) ? 1 : ((c2.label.toLowerCase() > c1.label.toLowerCase()) ? -1 : 0)); } }
			break;

			case ContractSortOrder.CodeId: {
				if (element) { return this.getContractsByCode(element.codeId); }
				else { return this.getCodeIds(); }
			}
			break;

			case ContractSortOrder.None:
			default: { if (!element) { return this.contracts; } }
			break;
		}
	}

	private getContractsByCode(codeId: number): Contract[] {
		return this.contracts.filter(c => c.codeId == codeId);
	}

	private getCodeIds(): Contract[] {
		let codeIds = [...new Set(this.contracts.map(c => c.codeId))].sort((a, b) => a - b);
		return codeIds.map(c => new Contract(c.toString(), "", c, ""));
	}

}
