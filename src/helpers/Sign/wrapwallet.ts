
import { EthSecp256k1HdWallet } from './ethsecp256k1hdwallet';
import { HdPath } from "@cosmjs/crypto";
const amino_1 = require("@cosmjs/amino");


export interface WrapSecp256k1HdWalletOptions {
    /** The password to use when deriving a BIP39 seed from a mnemonic. */
    readonly bip39Password: string;
    /** The BIP-32/SLIP-10 derivation paths. Defaults to the Cosmos Hub/ATOM path `m/44'/118'/0'/0/0`. */
    readonly hdPaths: readonly HdPath[];
    /** The bech32 address prefix (human readable part). Defaults to "cosmos". */
    readonly prefix: string;
}

const defaultOptions = {
    bip39Password: "",
    hdPaths: [(0, amino_1.makeCosmoshubPath)(0)],
    prefix: "cosmos",
};

export const SIGN_TYPE = {
    ethsecp256: 'ethsecp256',
    tmsecp256: 'tmsecp256'
};

export class WrapWallet {
    private signType;
    public mnemonic;

    constructor(type, mnemonic, options) {
        this.mnemonic = mnemonic;
        if (typeof type === "undefined" || type === null || type === "" || type === SIGN_TYPE.tmsecp256){
            this.signType = SIGN_TYPE.tmsecp256;
        }
        else{
            this.signType = SIGN_TYPE.ethsecp256;
        }
    }

    static async fromMnemonic(type: string, mnemonic: string, options?: Partial<WrapSecp256k1HdWalletOptions>): Promise<WrapWallet>{
        return new WrapWallet(type, mnemonic, {
            ...options,
        });
    }

    static async generate(type, length, options = {}) {
        if (typeof type === "undefined" || type === null || type === "" || type === SIGN_TYPE.tmsecp256){
           
        }
        else{
            return EthSecp256k1HdWallet.generate(length, options);
        }
    }

    async signDirect(signerAddress, signDoc) {
        if (this.signType === SIGN_TYPE.ethsecp256){
            let wallet = await this.getWallet();
            return wallet.signDirect(signerAddress, signDoc);
        }
        else{
            let wallet = await this.getWallet();
            return wallet.signDirect(signerAddress, signDoc);
        }
    }

    async signAmino(signerAddress, signDoc) {
        if (this.signType === SIGN_TYPE.ethsecp256){
            let wallet = await this.getWallet();
            return wallet.signAmino(signerAddress, signDoc);
        }
        else{
            let wallet = await this.getWallet();
            return wallet.signAmino(signerAddress, signDoc);
        }
    }

    public async getAccounts() {
        if (this.signType === SIGN_TYPE.ethsecp256){
            let wallet = await this.getWallet();
            return wallet.getAccounts();
        }
        else{
            let wallet = await this.getWallet();
            return wallet.getAccounts();
        }
    }

    async getWallet(){
        return EthSecp256k1HdWallet.fromMnemonic(this.mnemonic, {
                prefix: global.workspaceChain.addressPrefix,
        },);
    }

}
exports.WrapWallet = WrapWallet;
