import * as vscode from 'vscode';
import { Cosmwasm, CosmwasmAPI } from '../helpers/cosmwasm/api';
import { Workspace } from '../helpers/workspace';
import { Contract } from '../models/contract';
import { ContractDataProvider } from '../views/contractDataProvider';
import { WasmVmPanel } from '../views/WasmVmPanel';

export class ContractCmds {
    public static async Register(context: vscode.ExtensionContext) {
        this.registerAddContractCmd(context, contractViewProvider);
        this.registerSelectContractCmd(context);
        this.registerDeleteContractCmd(context, contractViewProvider);
        this.registerUpdateContractAdminCmd(context);
        this.registerClearContractAdminCmd(context);
        this.registerAddContractCommentCmd(context, contractViewProvider);
		this.registerUploadContractCmd(context);
		this.registerWasmVMCmd(context);
    }
    
	private static registerAddContractCmd(context: vscode.ExtensionContext, contractViewProvider: ContractDataProvider) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.addContract', (contractAddr: string) => {
			if (contractAddr) {
				importContract(contractAddr);
			}
			else {
				vscode.window.showInputBox({
					title: "Contract Address",
					placeHolder: "Cosmwasm contract address"
				}).then(contractAddrInput => {
					if (contractAddrInput) {
						importContract(contractAddrInput);
					}
				});
			}
		});
		context.subscriptions.push(disposable);

		function importContract(contractAddr: string) {
			if (!Contract.ContractAddressExists(context.globalState, contractAddr)) {
				vscode.window.withProgress({
					location: vscode.ProgressLocation.Notification,
					title: "Fetching the details for the contract - " + contractAddr,
					cancellable: false
				}, (progress, token) => {
					token.onCancellationRequested(() => { });
					progress.report({ message: '' });
					return new Promise((resolve, reject) => {
						CosmwasmAPI.GetContract(contractAddr).then(contract => {
							Contract.AddContract(context.globalState, contract);
							vscode.window.showInformationMessage("Added new contract: " + contract.codeId + ": " + contract.label);
							const contracts = Contract.GetContracts(context.globalState);
							contractViewProvider.refresh(contracts);
							resolve(contract);
						}).catch(err => {
							vscode.window.showErrorMessage("Could not import contract: " + contractAddr + " - " + err);
							reject(err);
						});
					});
				});
			}
			else {
				vscode.window.showErrorMessage("Contract has already been imported: " + contractAddr);
			}
		}
	}

	private static registerSelectContractCmd(context: vscode.ExtensionContext) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.selectContract', (contract: Contract) => {
			Workspace.SetSelectedContract(contract);
		});
		context.subscriptions.push(disposable);
	}

	private static registerDeleteContractCmd(context: vscode.ExtensionContext, contractViewProvider: ContractDataProvider) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.deleteContract', (item: Contract) => {
			vscode.window.showQuickPick(["Yes", "No"], {
				title: "Are you sure you want to delete the contract " + item.label + " ?",
				placeHolder: "Are you sure you want to delete the contract " + item.label + " ?",
			}).then(resp => {
				if (resp && resp.toLowerCase() === "yes") {
					Contract.DeleteContract(context.globalState, item)
					var contracts = Contract.GetContracts(context.globalState);
					contractViewProvider.refresh(contracts);
					vscode.window.showInformationMessage("Deleted contract: " + item.label);
				}
			})
		});
		context.subscriptions.push(disposable);
	}

	private static registerUpdateContractAdminCmd(context: vscode.ExtensionContext) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.updateContractAdmin', (contract: Contract) => {
			vscode.window.showInputBox({
				title: "New contract admin address",
				prompt: "New contract admin address"
			}).then(input => {
				if (input) {
					const account = Workspace.GetSelectedAccount();
					if (!account) {
						vscode.window.showErrorMessage("No account selected. Select an account from the Accounts view.");
						return;
					}
					vscode.window.withProgress({
						location: vscode.ProgressLocation.Notification,
						title: "Updating contract admin on the contract - " + contract.label,
						cancellable: false
					}, (progress, token) => {
						token.onCancellationRequested(() => { });
						progress.report({ message: '' });
						return new Promise(async (resolve, reject) => {
							await Cosmwasm.UpdateAdmin(account, contract, input, resolve, reject);
						});
					});
				}
			})
		});
		context.subscriptions.push(disposable);
	}

	private static registerClearContractAdminCmd(context: vscode.ExtensionContext) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.clearContractAdmin', (contract: Contract) => {
			const account = Workspace.GetSelectedAccount();
			if (!account) {
				vscode.window.showErrorMessage("No account selected. Select an account from the Accounts view.");
				return;
			}
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "Clearing contract admin on the contract - " + contract.label,
				cancellable: false
			}, (progress, token) => {
				token.onCancellationRequested(() => { });
				progress.report({ message: '' });
				return new Promise(async (resolve, reject) => {
					await Cosmwasm.ClearAdmin(account, contract, resolve, reject);
				});
			});
		});
		context.subscriptions.push(disposable);
	}

	private static registerAddContractCommentCmd(context: vscode.ExtensionContext, contractViewProvider: ContractDataProvider) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.addComments', (contract: Contract) => {
			if (contract) {
				vscode.window.showInputBox({
					title: "Add comments/notes for the contract",
					prompt: "Comments/notes added here will show up as you hover on the contract in the sidebar. This is purely to help with development and is not stored on-chain in any way",
					value: contract.notes
				}).then(input => {
					if (input) {
						contract.notes = input;
						Contract.UpdateContract(context.globalState, contract);
						contractViewProvider.refresh(Contract.GetContracts(context.globalState));
						vscode.window.showInformationMessage("Stored notes/comments for " + contract.label);
					}
				});
			}
		});
		context.subscriptions.push(disposable);
	}

    private static registerUploadContractCmd(context: vscode.ExtensionContext) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.upload', (item: vscode.Uri) => {
			if (item) {
				Contract.Upload(item)
			}
			else {
				vscode.window.showOpenDialog({
					canSelectFiles: true,
					canSelectFolders: false,
					canSelectMany: false,
					title: "title",
					openLabel: "label",
					filters: {
						'Cosmwasm Contract': ['wasm']
					}
				}).then(doc => {
					if (doc && doc.length > 0) {
						const wasmFile = doc[0];
						Contract.Upload(wasmFile);
					}
				})
			}
		});

		context.subscriptions.push(disposable);
	}

    private static registerWasmVMCmd(context: vscode.ExtensionContext) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.wasmInteract', async (wasm: vscode.Uri) => {
			const panel = vscode.window.createWebviewPanel(
				'wasm-vm',
				'contract.wasm',
				vscode.ViewColumn.Active,
				{
					enableScripts: true,
					retainContextWhenHidden: true
				}
			);
			const wasmBinary = await vscode.workspace.fs.readFile(wasm)
			let view = new WasmVmPanel(panel, wasmBinary);
			await view.getWebviewContent(context.extensionUri);
		});

		context.subscriptions.push(disposable);
	}
}