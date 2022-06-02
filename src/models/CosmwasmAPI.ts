import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { Contract } from './Contract';
import { Workspace } from "./Workspace";


export class CosmwasmAPI {
    public static async GetContract(contractAddress: string): Promise<Contract> {
        const rpcEndpoint = Workspace.GetWorkspaceChainConfig().rpcEndpoint;
        let client = await CosmWasmClient.connect(rpcEndpoint);
        const contractInfo = await client.getContract(contractAddress);
        let contract = new Contract(contractInfo.label, contractInfo.address, contractInfo.codeId, contractInfo.creator);
        client.disconnect();
        return contract;
    }
}
