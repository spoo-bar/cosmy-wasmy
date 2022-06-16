import * as vscode from 'vscode';
import { ExtData } from './ExtData';
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { Workspace } from './Workspace';
import { GasPrice } from '@cosmjs/stargate';


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

    public static DeleteContract(context: vscode.Memento, contract: Contract) {
        let contracts = this.GetContracts(context).filter(c => c.contractAddress != contract.contractAddress);
        ExtData.SaveContracts(context, contracts);
    }

    public static ContractAddressExists(context: vscode.Memento, contractAddr: string): boolean {
        const contracts = this.GetContracts(context);
        return contracts.some(c => c.contractAddress === contractAddr);
    }

    public static async Upload(wasmFile: vscode.Uri) {
        const account = Workspace.GetSelectedAccount();
        if (!account) {
            vscode.window.showErrorMessage("No account selected. Select an account from the Accounts view.");
            return;
        }

        const file = await vscode.workspace.fs.readFile(wasmFile)
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Uploading the contract",
            cancellable: false
        }, (progress, token) => {
            token.onCancellationRequested(() => { });
            progress.report({ message: '' });
            return new Promise(async (resolve, reject) => {
                try {
                    let signer = await DirectSecp256k1HdWallet.fromMnemonic(account.mnemonic, {
                        prefix: Workspace.GetWorkspaceChainConfig().addressPrefix,
                    });
                    let gasPrice = Workspace.GetWorkspaceChainConfig().defaultGasPrice + Workspace.GetWorkspaceChainConfig().chainDenom;
                    let client = await SigningCosmWasmClient.connectWithSigner(
                        Workspace.GetWorkspaceChainConfig().rpcEndpoint,
                        signer, {
                            gasPrice: GasPrice.fromString(gasPrice)
                    });
                    let res = await client.upload(account.address, file, "auto");
                    let output = "// Wasm file path: \n";
                    output += wasmFile.fsPath + "\n\n";
                    output += "// Upload Result \n\n";
                    output += JSON.stringify(res, null, 4);
                    outputResponse(output);
                    resolve(output);
                }
                catch (err: any) {
                    let output = getErrorOutput(wasmFile, err);
                    outputResponse(output);
                    reject(output);
                }
            })
        });

        function getErrorOutput(wasmFile: vscode.Uri, err: any): string {
            let output = "// Wasm file path: \n";
            output += wasmFile.fsPath + "\n\n";
            output += "// ⚠️ Upload failed \n\n";
            output += err;
            return output;
        }

        function outputResponse(output: string) {
            vscode.workspace.openTextDocument({
                language: "jsonc"
            }).then(doc => {
                vscode.window.showTextDocument(doc).then(editor => {
                    editor.insertSnippet(new vscode.SnippetString(output));
                });
            });
        }
    }
}


