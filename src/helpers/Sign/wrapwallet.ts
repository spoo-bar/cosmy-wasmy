
import { EthSecp256k1HdWallet } from './ethsecp256k1hdwallet';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { Secp256k1HdWallet } from "@cosmjs/launchpad";
import { HdPath } from "@cosmjs/crypto";

export interface WrapSecp256k1HdWalletOptions {
    /** The password to use when deriving a BIP39 seed from a mnemonic. */
    readonly bip39Password: string;
    /** The BIP-32/SLIP-10 derivation paths. Defaults to the Cosmos Hub/ATOM path `m/44'/118'/0'/0/0`. */
    readonly hdPaths: readonly HdPath[];
    /** The bech32 address prefix (human readable part). Defaults to "cosmos". */
    readonly prefix: string;
}

export const SIGN_TYPE = {
    ethsecp256: 'ethsecp256',
    tmsecp256: 'tmsecp256'
};

export class WrapWallet {
    private signType;
    public mnemonic;

    constructor(type, mnemonic, options) {
        this.mnemonic = mnemonic;
        this.signType = WrapWallet.isEthSecp256(type) ? SIGN_TYPE.ethsecp256 : SIGN_TYPE.tmsecp256;;
    }

    static async fromMnemonic(type: string, mnemonic: string, options?: Partial<WrapSecp256k1HdWalletOptions>): Promise<WrapWallet>{
        return new WrapWallet(type, mnemonic, {
            ...options,
        });
    }

    static async generate(type, length, options = {}) {
        if (WrapWallet.isEthSecp256(type)){
            return EthSecp256k1HdWallet.generate(length, options);
        }
        return DirectSecp256k1HdWallet.generate(length, options);
    }

    static isEthSecp256(type){
        if (typeof type !== "undefined" && type !== null && type !== "" && type === SIGN_TYPE.ethsecp256){
            return true;
        }
        return false;
    }

    async signDirect(signerAddress, signDoc) {
        let wallet = await this.getWallet();
        return wallet.signDirect(signerAddress, signDoc);
    }

    async signAmino(signerAddress, signDoc) {
        let wallet = (this.signType === SIGN_TYPE.ethsecp256) ? (await EthSecp256k1HdWallet.fromMnemonic(this.mnemonic, {
            prefix: global.workspaceChain.addressPrefix,
        },)) : (await Secp256k1HdWallet.fromMnemonic(this.mnemonic, {
            prefix: global.workspaceChain.addressPrefix,
        }));

        return wallet.signAmino(signerAddress, signDoc);
    }

    public async getAccounts() {
        return (await this.getWallet()).getAccounts();
    }

    async getWallet(){
        if (this.signType !== SIGN_TYPE.ethsecp256){
            return DirectSecp256k1HdWallet.fromMnemonic(this.mnemonic, {
                prefix: global.workspaceChain.addressPrefix,
            },);
        }
        return EthSecp256k1HdWallet.fromMnemonic(this.mnemonic, {
            prefix: global.workspaceChain.addressPrefix,
        },);
    }

}
exports.WrapWallet = WrapWallet;
