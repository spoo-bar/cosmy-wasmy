import * as vscode from 'vscode';
import { ExtData } from '../helpers/ExtData';
import { Workspace } from '../helpers/Workspace';
import { Cosmwasm } from '../helpers/CosmwasmAPI';
import { ResponseHandler } from '../helpers/ResponseHandler';


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
                    let client = await Cosmwasm.GetSigningClient();
                    let res = await client.upload(account.address, file, "auto");
                    ResponseHandler.OutputSuccess(wasmFile.fsPath, JSON.stringify(res, null, 4), "Smart Contract Upload");
                    resolve(undefined);
                }
                catch (err: any) {
                    ResponseHandler.OutputError(wasmFile.fsPath, err, "Smart Contract Upload");
                    reject(undefined);
                }
            })
        });
    }
}


