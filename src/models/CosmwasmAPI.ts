import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { FaucetClient } from "@cosmjs/faucet-client";
import { Contract } from './Contract';
import { Workspace } from "./Workspace";


export class CosmwasmAPI {
    public static async GetContract(contractAddress: string): Promise<Contract> {
        let client = Cosmwasm.Client;
        const contractInfo = await client.getContract(contractAddress);
        let contract = new Contract(contractInfo.label, contractInfo.address, contractInfo.codeId, contractInfo.creator);
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
}