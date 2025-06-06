import { CodeDetails, CosmWasmClient, MsgExecuteContractEncodeObject, SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { FaucetClient } from "@cosmjs/faucet-client";
import { GasPrice } from '@cosmjs/stargate';
import { MsgExecuteContract, } from "cosmjs-types/cosmwasm/wasm/v1/tx";
import { TextEncoder } from "util";
import { Account } from "../../models/account";
import { Contract } from '../../models/contract';
import { Utils } from "../../views/utils";
import { ResponseHandler } from "../responseHandler";
import { WrapWallet } from '../sign/wrapwallet';
import { Workspace } from "../workspace";


export class CosmwasmAPI {
    public static async GetContract(contractAddress: string): Promise<Contract> {
        let client = await Cosmwasm.GetQueryClient();
        const contractInfo = await client.getContract(contractAddress);
        let contract = new Contract(contractInfo.label, contractInfo.address, contractInfo.codeId, contractInfo.creator, global.workspaceChain.configName);
        return contract;
    }

    public static async GetAllContracts(): Promise<Contract[]> {
        let importedContracts = new Array<Contract>();
        let client = await Cosmwasm.GetQueryClient();
        const codes = await client.getCodes();
        for (let code of codes) {
            const contracts = await client.getContracts(code.id);
            for (let contract of contracts) {
                let contractInfo = await client.getContract(contract);
                importedContracts.push(new Contract(contractInfo.label, contractInfo.address, contractInfo.codeId, contractInfo.creator, global.workspaceChain.configName));
            }
        }
        return importedContracts;
    }

    public static async GetUserContracts(userAddress: string): Promise<Contract[]> {
        let importedContracts = new Array<Contract>();
        let client = await Cosmwasm.GetQueryClient();
        const contracts = await client.getContractsByCreator(userAddress);
        for (let contract of contracts) {
            let contractInfo = await client.getContract(contract);
            importedContracts.push(new Contract(contractInfo.label, contractInfo.address, contractInfo.codeId, contractInfo.creator, global.workspaceChain.configName));
        }
        return importedContracts;
    }

    public static async GetBalance(address: string): Promise<string> {
        let client = await Cosmwasm.GetQueryClient();
        let denom = global.workspaceChain.chainDenom;
        let balance = await client.getBalance(address, denom);

        let decimals = global.workspaceChain.chainDenomDecimals;
        if (!isNaN(parseFloat(decimals))) {
            return Utils.TransDecimals(balance.amount, decimals);
        }

        return balance.amount;
    }

    public static async RequestFunds(address: string) {
        const faucetEndpoint = global.workspaceChain.faucetEndpoint;
        let faucet = new FaucetClient(faucetEndpoint);
        let denom = global.workspaceChain.chainDenom;
        await faucet.credit(address, denom);
    }

    public static async GetCodeDetails(codeId: number): Promise<CodeDetails> {
        let client = await Cosmwasm.GetQueryClient();
        const codeDetails = await client.getCodeDetails(codeId);
        return codeDetails;
    }
}

export class Cosmwasm {

    public static async GetQueryClient(): Promise<CosmWasmClient> {
        const rpcEndpoint = global.workspaceChain.rpcEndpoint;
        return CosmWasmClient.connect(rpcEndpoint);
    }

    public static async GetSigningClient(): Promise<SigningCosmWasmClient> {
        const account = Workspace.GetSelectedAccount();
        let signer = await WrapWallet.fromMnemonic(global.workspaceChain.signType, global.workspaceChain.coinType, account.mnemonic, {
            prefix: global.workspaceChain.addressPrefix,
        });
        let gasDenom = global.workspaceChain.chainGasDenom;
        if (!gasDenom) {
            gasDenom = global.workspaceChain.chainDenom;
        }

        let gasPrice = global.workspaceChain.defaultGasPrice + gasDenom;
        let client = await SigningCosmWasmClient.connectWithSigner(
            global.workspaceChain.rpcEndpoint,
            signer, {
            gasPrice: GasPrice.fromString(gasPrice)
        });
        return client;
    }

    public static async Query(contract: string, query: any) {
        try {
            let resp = await (await Cosmwasm.GetQueryClient()).queryContractSmart(contract, query);
            ResponseHandler.OutputSuccess(JSON.stringify(query, null, 4), JSON.stringify(resp, null, 4), "Query");
            return {
                isSuccess: true,
                response: resp
            };
        }
        catch (err: any) {
            ResponseHandler.OutputError(JSON.stringify(query, null, 4), err, "Query");
            return {
                isSuccess: false,
                response: err
            };
        }
    }

    public static async QueryTx(txHash: string) {
        try {
            let resp = await (await Cosmwasm.GetQueryClient()).getTx(txHash);
            ResponseHandler.OutputSuccess(txHash, JSON.stringify(resp, null, 4), "Query Tx");
            return {
                isSuccess: true,
                response: resp
            };
        }
        catch (err: any) {
            ResponseHandler.OutputError(txHash, err, "Query Tx");
            return {
                isSuccess: false,
                response: err
            };
        }
    }

    public static async Execute(account: Account, contract: string, req: any, memo: string, fundsStr: string) {
        try {
            let client = await Cosmwasm.GetSigningClient();
            let funds = Utils.ParseCoins(fundsStr);
            let response = await client.execute(account.address, contract, req, "auto", memo, funds);
            ResponseHandler.OutputSuccess(JSON.stringify(req, null, 4), JSON.stringify(response, null, 4), "Tx");
            return {
                isSuccess: true,
                response: response
            };
        }
        catch (err: any) {
            ResponseHandler.OutputError(JSON.stringify(req, null, 4), err, "Tx");
            return {
                isSuccess: false,
                response: err
            };
        }
    }

    public static async Simulate(account: Account, contract: string, req: any, memo: string, fundsStr: string) {
        try {
            let client = await Cosmwasm.GetSigningClient();
            let funds = Utils.ParseCoins(fundsStr);
            const inputJson = JSON.stringify(req);
            const encodeInput = toUtf8(inputJson);
            const encodeMsg = MsgExecuteContract.fromPartial({
                sender: account.address,
                contract: contract,
                msg: encodeInput,
                funds: [...(funds || [])],
            });
            const msg: MsgExecuteContractEncodeObject = {
                typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
                value: encodeMsg,
            };
            let gasConsumed = await client.simulate(account.address, [msg], memo)
            ResponseHandler.OutputSuccess(JSON.stringify(req, null, 4), "Gas Consumed: " + gasConsumed, "Simulate");
            return {
                isSuccess: true,
                response: gasConsumed
            };
        }
        catch (err: any) {
            ResponseHandler.OutputError(JSON.stringify(req, null, 4), err, "Simulate");
            return {
                isSuccess: false,
                response: err
            };
        }
    }

    // public static async ExecuteMultiple(account: Account, txs: ExecuteInstruction[]) {
    //     try {
    //         let client = await Cosmwasm.GetSigningClient();
    //         let response = await client.executeMultiple(account.address, txs, "auto");
    //         ResponseHandler.OutputSuccess(JSON.stringify(txs, null, 4), JSON.stringify(response, null, 4), "Tx");
    //         return {
    //             isSuccess: true,
    //             response: response
    //         };
    //     }
    //     catch (err: any) {
    //         ResponseHandler.OutputError(JSON.stringify(txs, null, 4), err, "Tx");
    //         return {
    //             isSuccess: false,
    //             response: err
    //         };
    //     }
    // }

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

    public static async SendTokens(account: Account, recipientAddress: string, fundsStr: string, memo: string) {
        try {
            let funds = Utils.ParseCoins(fundsStr);
            let client = await Cosmwasm.GetSigningClient();
            let response = await client.sendTokens(account.address, recipientAddress, funds, "auto", memo);
            return {
                isSuccess: true,
                response: response
            };
        }
        catch (err: any) {
            return {
                isSuccess: false,
                response: err
            };
        }
    }
}
function toUtf8(str: string): Uint8Array {
    return new TextEncoder().encode(str);
}
