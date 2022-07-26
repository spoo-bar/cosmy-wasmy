import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { GasPrice } from '@cosmjs/stargate';
import { FaucetClient } from "@cosmjs/faucet-client";
import { Contract } from '../models/Contract';
import { Workspace } from "./Workspace";
import { ResponseHandler } from "./ResponseHandler";
import { Account } from "../models/Account";


export class CosmwasmAPI {
    public static async GetContract(contractAddress: string): Promise<Contract> {
        let client = Cosmwasm.Client;
        const contractInfo = await client.getContract(contractAddress);
        let contract = new Contract(contractInfo.label, contractInfo.address, contractInfo.codeId, contractInfo.creator, Workspace.GetWorkspaceChainConfig().configName);
        return contract;
    }

    public static async GetBalance(address: string): Promise<string> {
        let client = Cosmwasm.Client;
        let denom = Workspace.GetWorkspaceChainConfig().chainDenom;
        let balance = await client.getBalance(address, denom);
        return balance.amount;
    }

    public static async RequestFunds(address: string) {
        const faucetEndpoint = Workspace.GetWorkspaceChainConfig().faucetEndpoint;
        let faucet = new FaucetClient(faucetEndpoint);
        let denom = Workspace.GetWorkspaceChainConfig().chainDenom;
        await faucet.credit(address, denom);
    }
}

export class Cosmwasm {
    private static _instance: CosmWasmClient;

    private constructor() { }

    public static CreateClientAsync = async () => {
        new Cosmwasm();
        await Cosmwasm.createCosmwasmClient();
    };

    private static async createCosmwasmClient() {
        const rpcEndpoint = Workspace.GetWorkspaceChainConfig().rpcEndpoint;
        Cosmwasm._instance = await CosmWasmClient.connect(rpcEndpoint);
    }

    public static get Client() {
        return this._instance;
    }

    public static async GetSigningClient(): Promise<SigningCosmWasmClient> {
        const account = Workspace.GetSelectedAccount();
        let signer = await DirectSecp256k1HdWallet.fromMnemonic(account.mnemonic, {
            prefix: Workspace.GetWorkspaceChainConfig().addressPrefix,
        });
        let gasPrice = Workspace.GetWorkspaceChainConfig().defaultGasPrice + Workspace.GetWorkspaceChainConfig().chainDenom;
        let client = await SigningCosmWasmClient.connectWithSigner(
            Workspace.GetWorkspaceChainConfig().rpcEndpoint,
            signer, {
            gasPrice: GasPrice.fromString(gasPrice)
        });
        return client;
    }

    public static async Query(contract: Contract, query: any, resolve: (value: unknown) => void, reject: (reason?: any) => void) {
		try {
			let resp = await Cosmwasm.Client.queryContractSmart(contract.contractAddress, query);
			ResponseHandler.OutputSuccess(JSON.stringify(query, null, 4), JSON.stringify(resp, null, 4), "Query");
			resolve(undefined);
		}
		catch (err: any) {
			ResponseHandler.OutputError(JSON.stringify(query, null, 4), err, "Query");
			reject(undefined);
		}
	}

    public static async Execute(account: Account, contract: Contract, req: any, resolve: (value: unknown) => void, reject: (reason?: any) => void) {
		try {
            let client = await Cosmwasm.GetSigningClient();
			let response = await client.execute(account.address, contract.contractAddress, req, "auto");
			ResponseHandler.OutputSuccess(JSON.stringify(req, null, 4), JSON.stringify(response, null, 4), "Tx");
			resolve(undefined);
		}
		catch (err: any) {
			ResponseHandler.OutputError(JSON.stringify(req, null, 4), err, "Tx");
			reject(undefined);
		}
	}

    public static async UpdateAdmin(account: Account, contract: Contract, newAdmin: string, resolve: (value: unknown) => void, reject: (reason?: any) => void) {
        const input = {
            oldAdmin: account.address,
            contract: contract.contractAddress,
            newAdmin: newAdmin
        };
        try {
            let client = await Cosmwasm.GetSigningClient();
			let response = await client.updateAdmin(account.address, contract.contractAddress, newAdmin, "auto");
			ResponseHandler.OutputSuccess(JSON.stringify(input, null, 4), JSON.stringify(response, null, 4), "Update Admin");
			resolve(undefined);
		}
		catch (err: any) {
			ResponseHandler.OutputError(JSON.stringify(input, null, 4), err, "Update Admin");
			reject(undefined);
		}
	}

    public static async ClearAdmin(account: Account, contract: Contract, resolve: (value: unknown) => void, reject: (reason?: any) => void) {
        const input = {
            oldAdmin: account.address,
            contract: contract.contractAddress,
        };
        try {
            let client = await Cosmwasm.GetSigningClient();
			let response = await client.clearAdmin(account.address, contract.contractAddress, "auto");
			ResponseHandler.OutputSuccess(JSON.stringify(input, null, 4), JSON.stringify(response, null, 4), "Clear Admin");
			resolve(undefined);
		}
		catch (err: any) {
			ResponseHandler.OutputError(JSON.stringify(input, null, 4), err, "Clear Admin");
			reject(undefined);
		}
	}
}