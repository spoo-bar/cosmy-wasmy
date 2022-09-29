import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { TextDecoder } from 'util';
import * as vscode from 'vscode';
import { Cosmwasm } from './api';



export class SmartExecutor {

    private wallet: DirectSecp256k1HdWallet;
    private address: string;
    private client: CosmWasmClient;

    public async SetupAccount(mnemonic: string, addressPrefix: string) {
        this.wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
            prefix: addressPrefix,
        });
        const accounts = await this.wallet.getAccounts();
        this.address = accounts[0].address;
    }

    public GetAccountAddress(): string {
        return this.address
    }

    public async SetupClient(rpcClient: string) {
        this.client = await CosmWasmClient.connect(rpcClient);
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
            return await Cosmwasm.Query(contractAddress, input);
        }

        // Check if the call is a tx
        const executeSchema = vscode.Uri.joinPath(workspaceFolder.uri, "schema", "execute_msg.json");
        const executeContent = decoder.decode(await vscode.workspace.fs.readFile(executeSchema));
        const execs = JSON.parse(executeContent).oneOf.map(e => e.required[0]);
        if (execs.some(e => e == call)) {
            //return await Cosmwasm.Execute(account, contractAddress, input);
        }

        // const instantiateSchema = vscode.Uri.joinPath(workspaceFolder.uri, "schema", "instantiate_msg.json");
        // const migrateSchema = vscode.Uri.joinPath(workspaceFolder.uri, "schema", "migrate_msg.json");
        return;
    }
}
