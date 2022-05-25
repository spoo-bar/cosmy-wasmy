import * as vscode from 'vscode';
import {CosmWasmClient} from "@cosmjs/cosmwasm-stargate";
export class Contract extends vscode.TreeItem {

    name: string;
    id: string;
    contract_address: string;
    creator_address: string;
    admin_address: string | undefined;

    /**
     *
     */
    constructor(name: string, id: string, contract: string, creator: string, admin: string | undefined) {
        super(name);
        this.name = name;
        this.id = id;
        this.contract_address = contract;
        this.creator_address = creator;
        this.admin_address = admin;
    }

    public static GetContracts(context: vscode.Memento): Contract[] {
        const contractData = context.get<Contract[]>("contract");
		if (contractData) {
			return contractData;
		}
		return [];
    }

    public static async AddContracts(context: vscode.Memento, contract: Contract) {
        // let client  = await CosmWasmClient.connect("https://rpc.uni.juno.deuslabs.fi");
        // const c = await client.getContract("");
        // let cc = new Contract(c.label, c.codeId.toString(), c.address, c.creator, c.admin);
        let contracts = this.GetContracts(context);
		contracts.push(contract);
		context.update("contract", contracts);
    }
}
