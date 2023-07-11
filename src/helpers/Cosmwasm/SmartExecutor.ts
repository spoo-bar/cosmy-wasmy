import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { GasPrice } from '@cosmjs/stargate';
import { WrapWallet } from '../sign/wrapwallet';
import { TextDecoder } from 'util';
import * as vscode from 'vscode';

export class SmartExecutor {

    private wallet: WrapWallet;
    private address: string;
    private client: SigningCosmWasmClient;

    public async SetupAccount(mnemonic: string, addressPrefix: string) {
        this.wallet = await WrapWallet.fromMnemonic(global.workspaceChain.signType, mnemonic, {
            prefix: addressPrefix,
        });
        const accounts = await this.wallet.getAccounts();
        this.address = accounts[0].address;
    }

    public async SetupClient(rpcClient: string, gasPrice: string) {
        this.client = await SigningCosmWasmClient.connectWithSigner(
            rpcClient,
            this.wallet,
            {
                gasPrice: GasPrice.fromString(gasPrice)
            });
    }

    public GetAccountAddress(): string {
        return this.address
    }

    // this func aint really all that smart tho
    public async SmartCall(contractAddress: string, input: any, account: string) {
        const call = Object.keys(input)[0];
        const workspaceFolder = vscode.workspace.workspaceFolders[0];
        const decoder = new TextDecoder();

        // Check if the call is a query
        const querySchema = vscode.Uri.joinPath(workspaceFolder.uri, "schema", "query_msg.json");
        const queryContent = decoder.decode(await vscode.workspace.fs.readFile(querySchema));
        const queries = JSON.parse(queryContent).oneOf.map(q => q.required[0]);
        if (queries.some(q => q == call)) {
            try {
                let resp = await this.client.queryContractSmart(contractAddress, input);
                return {
                    isSuccess: true,
                    response: resp
                };
            }
            catch (err) {
                return {
                    isSuccess: false,
                    response: err
                };
            }
        }

        // Check if the call is a tx
        const executeSchema = vscode.Uri.joinPath(workspaceFolder.uri, "schema", "execute_msg.json");
        const executeContent = decoder.decode(await vscode.workspace.fs.readFile(executeSchema));
        const execs = JSON.parse(executeContent).oneOf.map(e => e.required[0]);
        if (execs.some(e => e == call)) {
            try {
                let resp = await this.client.execute(this.address, contractAddress, input, "auto");
                return {
                    isSuccess: true,
                    response: resp
                };
            }
            catch (err) {
                return {
                    isSuccess: false,
                    response: err
                };
            }
        }

        // // Check if the call is an instantiate msg
        // const instantiateSchema = vscode.Uri.joinPath(workspaceFolder.uri, "schema", "instantiate_msg.json");
        // const instantiateContent = decoder.decode(await vscode.workspace.fs.readFile(instantiateSchema));
        // const instantiateMsg = JSON.parse(instantiateContent).oneOf.map(e => e.required[0]);
        // if (instantiateMsg.some(e => e == call)) {
        //     try {
        //         let resp = await this.client.instantiate(this.address, 0, input, "", "auto");
        //         return {
        //             isSuccess: true,
        //             response: resp
        //         };
        //     }
        //     catch (err) {
        //         return {
        //             isSuccess: false,
        //             response: err
        //         };
        //     }
        // }

        // const migrateSchema = vscode.Uri.joinPath(workspaceFolder.uri, "schema", "migrate_msg.json");
        return {
            isSuccess: false,
            response: new Error(vscode.l10n.t("Could not find any matching query or msg endpoint for given input: {call}", { call: call }))
        };
    }
}
