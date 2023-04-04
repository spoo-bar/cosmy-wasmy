import { CodeDetails, CosmWasmClient, ExecuteInstruction } from "@cosmjs/cosmwasm-stargate";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { Coin, parseCoins } from "@cosmjs/proto-signing";
import { EthSecp256k1HdWallet } from '../Sign/ethsecp256k1hdwallet';
import { GasPrice } from '@cosmjs/stargate';
import { FaucetClient } from "@cosmjs/faucet-client";
import { Contract } from '../../models/contract';
import { Workspace } from "../workspace";
import { ResponseHandler } from "../responseHandler";
import { Account } from "../../models/account";
import { util } from "protobufjs";
import { utils } from "elliptic";
import { Utils } from "../../views/utils";
import { stringToPath } from "@cosmjs/crypto";


export class CosmwasmAPI {
    public static async GetContract(contractAddress: string): Promise<Contract> {
        let client = await Cosmwasm.GetQueryClient();
        const contractInfo = await client.getContract(contractAddress);
        let contract = new Contract(contractInfo.label, contractInfo.address, contractInfo.codeId, contractInfo.creator, global.workspaceChain.configName);
        return contract;
    }

    public static async GetBalance(address: string): Promise<string> {
        let client = await Cosmwasm.GetQueryClient();
        let denom = global.workspaceChain.chainDenom;
        let balance = await client.getBalance(address, denom);

        return Utils.TransDecimals(balance.amount, global.workspaceChain.chainDenomDecimals);
        //return balance.amount;
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

    public static async GetQueryClient() {
        const rpcEndpoint = global.workspaceChain.rpcEndpoint;
        return await CosmWasmClient.connect(rpcEndpoint);
    }
    

    public static async GetSigningClient(): Promise<SigningCosmWasmClient> {
        const account = Workspace.GetSelectedAccount();

        // m/44'/118'/0'/0/0
		// m/44'/60'/0'/0/0

        const path = stringToPath("m/44'/118'/0'/0/0");
        var pathArray = [path];
        let signer = await EthSecp256k1HdWallet.fromMnemonic(account.mnemonic, {
            prefix: global.workspaceChain.addressPrefix,
            hdPaths: pathArray,
        });
        let gasPrice = global.workspaceChain.defaultGasPrice + global.workspaceChain.chainGasDenom;
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

    public static async Execute(account: Account, contract: string, req: any, memo: string, fundsStr: string) {
        try {
            let client = await Cosmwasm.GetSigningClient();
            let funds = parseCoins(fundsStr);
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

    public static async ExecuteMultiple(account: Account, txs: ExecuteInstruction[]) {
        try {
            let client = await Cosmwasm.GetSigningClient();
            let response = await client.executeMultiple(account.address, txs, "auto");
            ResponseHandler.OutputSuccess(JSON.stringify(txs, null, 4), JSON.stringify(response, null, 4), "Tx");
            return {
                isSuccess: true,
                response: response
            };
        }
        catch (err: any) {
            ResponseHandler.OutputError(JSON.stringify(txs, null, 4), err, "Tx");
            return {
                isSuccess: false,
                response: err
            };
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