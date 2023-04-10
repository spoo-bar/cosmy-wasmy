import { EnglishMnemonic} from "@cosmjs/crypto";
import { SignDoc } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { AccountData, DirectSignResponse, OfflineDirectSigner } from "@cosmjs/proto-signing/build/signer";
import { StdSignDoc } from "@cosmjs/amino";
import { AminoSignResponse } from "@cosmjs/amino/build/signer";
import {DirectSecp256k1HdWalletOptions} from "@cosmjs/proto-signing/build/directsecp256k1hdwallet"

interface EthSecp256k1HdWalletConstructorOptions extends Partial<DirectSecp256k1HdWalletOptions> {
    readonly seed: Uint8Array;
}

// Adaptive ethespec251 wallet to cosmsjs
export declare class EthSecp256k1HdWallet implements OfflineDirectSigner {
    static fromMnemonic(mnemonic: string, options?: Partial<DirectSecp256k1HdWalletOptions>): Promise<EthSecp256k1HdWallet>;
    static generate(length?: 12 | 15 | 18 | 21 | 24, options?: Partial<DirectSecp256k1HdWalletOptions>): Promise<EthSecp256k1HdWallet>;

    protected constructor(mnemonic: EnglishMnemonic, options: EthSecp256k1HdWalletConstructorOptions);
    
    getAccounts(): Promise<readonly AccountData[]>;
    signDirect(signerAddress: string, signDoc: SignDoc): Promise<DirectSignResponse>;
    signAmino(signerAddress: string, signDoc: StdSignDoc): Promise<AminoSignResponse>;

    get mnemonic(): string;
    private readonly accounts;
    private getAccountsWithPrivkeys;
    private readonly secret;
}
export {};
