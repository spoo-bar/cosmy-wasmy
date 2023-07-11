import path = require('path');
import * as vscode from 'vscode';
import { Cosmwasm, CosmwasmAPI } from '../helpers/cosmwasm/api';
import { Workspace } from '../helpers/workspace';
import { Contract } from '../models/contract';
import { ContractDataProvider } from '../views/contractDataProvider';
import { CosmwasmTerminal } from '../views/cosmwasmTerminal';
import { WasmVmPanel } from '../views/wasmVmPanel';

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
		this.registerGetContractChecksumCmd(context);
		this.registerDownloadContractBinaryCmd(context);
	}

	private static registerAddContractCmd(context: vscode.ExtensionContext, contractViewProvider: ContractDataProvider) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.addContract', () => {
			vscode.window.showInputBox({
				title: vscode.l10n.t("Contract Address"),
				placeHolder: vscode.l10n.t("Cosmwasm contract address")
			}).then(contractAddrInput => {
				if (contractAddrInput) {
					importContract(contractAddrInput);
				}
			});
		});
		context.subscriptions.push(disposable);

		function importContract(contractAddr: string) {
			if (!Contract.ContractAddressExists(context.globalState, contractAddr)) {
				vscode.window.withProgress({
					location: vscode.ProgressLocation.Notification,
					title: vscode.l10n.t("Fetching the details for the contract - {addr}", {
						addr: contractAddr
					}),
					cancellable: false
				}, (progress, token) => {
					token.onCancellationRequested(() => { });
					progress.report({ message: '' });
					return new Promise((resolve, reject) => {
						CosmwasmAPI.GetContract(contractAddr).then(contract => {
							Contract.AddContract(context.globalState, contract);
							vscode.window.showInformationMessage(vscode.l10n.t("Added new contract: {codeId} - {label}", {
								codeId: contract.codeId,
								label: contract.label
							}));
							const contracts = Contract.GetContracts(context.globalState);
							contractViewProvider.refresh(contracts);
							resolve(contract);
						}).catch(err => {
							vscode.window.showErrorMessage(vscode.l10n.t("Could not import contract: {addr} - {err}", {
								addr: contractAddr,
								err: err
							}));
							reject(err);
						});
					});
				});
			}
			else {
				vscode.window.showErrorMessage(vscode.l10n.t("Contract has already been imported: {addr}", {
					addr: contractAddr
				}));
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
				title: vscode.l10n.t("Are you sure you want to delete the contract {label}?", {
					label: item.label
				}),
				placeHolder: vscode.l10n.t("Are you sure you want to delete the contract {label} ?", {
					label: item.label
				}),
			}).then(resp => {
				if (resp && resp.toLowerCase() === "yes") {
					Contract.DeleteContract(context.globalState, item)
					var contracts = Contract.GetContracts(context.globalState);
					contractViewProvider.refresh(contracts);
					vscode.window.showInformationMessage(vscode.l10n.t("Deleted contract: {label}", { label: item.label }));
				}
			})
		});
		context.subscriptions.push(disposable);
	}

	private static registerUpdateContractAdminCmd(context: vscode.ExtensionContext) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.updateContractAdmin', (contract: Contract) => {
			vscode.window.showInputBox({
				title: vscode.l10n.t("New contract admin address"),
				prompt: vscode.l10n.t("New contract admin address")
			}).then(input => {
				if (input) {
					const account = Workspace.GetSelectedAccount();
					if (!account) {
						vscode.window.showErrorMessage(vscode.l10n.t("No account selected. Select an account from the Accounts view."));
						return;
					}
					vscode.window.withProgress({
						location: vscode.ProgressLocation.Notification,
						title: vscode.l10n.t("Updating contract admin on the contract - {label}", { label: contract.label }),
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
				vscode.window.showErrorMessage(vscode.l10n.t("No account selected. Select an account from the Accounts view."));
				return;
			}
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: vscode.l10n.t("Clearing contract admin on the contract - {label}", { label: contract.label }),
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
					title: vscode.l10n.t("Add comments/notes for the contract"),
					prompt: vscode.l10n.t("Comments/notes added here will show up as you hover on the contract in the sidebar. This is purely to help with development and is not stored on-chain in any way"),
					value: contract.notes
				}).then(input => {
					if (input) {
						contract.notes = input;
						Contract.UpdateContract(context.globalState, contract);
						contractViewProvider.refresh(Contract.GetContracts(context.globalState));
						vscode.window.showInformationMessage(vscode.l10n.t("Stored notes/comments for {label}", { label: contract.label }));
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
					title: vscode.l10n.t("Select Wasm file"),
					openLabel: vscode.l10n.t("Upload"),
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
			const contractName = path.basename(wasm.toString());
			const panel = vscode.window.createWebviewPanel(
				'wasm-vm',
				contractName,
				vscode.ViewColumn.Active,
				{
					enableScripts: true,
					retainContextWhenHidden: true,
				}
			);
			panel.iconPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'icon.svg');
			const wasmBinary = await vscode.workspace.fs.readFile(wasm)
			let view = new WasmVmPanel(panel, wasmBinary);
			await view.getWebviewContent(context.extensionUri);
		});

		context.subscriptions.push(disposable);
	}

	private static registerGetContractChecksumCmd(context: vscode.ExtensionContext) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.getContractChecksum', async (contract: Contract) => {
			const codeId = contract.codeId;
			const codeDetails = await CosmwasmAPI.GetCodeDetails(codeId);
			const output = {
				codeId: codeId,
				checksum: codeDetails.checksum
			};
			CosmwasmTerminal.output(JSON.stringify(output, undefined, 4));
		});
		context.subscriptions.push(disposable);
	}

	private static registerDownloadContractBinaryCmd(context: vscode.ExtensionContext) {
		let disposable = vscode.commands.registerCommand('cosmy-wasmy.downloadContractBinary', async (contract: Contract) => {
			const codeId = contract.codeId;
			const codeDetails = await CosmwasmAPI.GetCodeDetails(codeId);
			const binary = codeDetails.data;
			if (vscode.workspace.fs.isWritableFileSystem) {
				const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, contract.contractAddress + ".wasm");
				await vscode.workspace.fs.writeFile(uri, binary);
				vscode.window.showInformationMessage(vscode.l10n.t("Downloaded {label} as {addr}.wasm", {
					label: contract.label,
					addr: contract.contractAddress
				}))
			}
			else {
				vscode.window.showErrorMessage(vscode.l10n.t("The current workspace is not writeable. Could not download the binary as a file."))
			}
		});
		context.subscriptions.push(disposable);
	}
}