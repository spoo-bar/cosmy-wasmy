
import { EthSecp256k1HdWallet } from './ethsecp256k1hdwallet';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { Secp256k1HdWallet } from "@cosmjs/launchpad";
import { DirectSecp256k1HdWalletOptions } from "@cosmjs/proto-signing/build/directsecp256k1hdwallet";
import { HdPath,Slip10RawIndex } from "@cosmjs/crypto";

export const SIGN_TYPE = {
    ethsecp256k1: 'ethsecp256k1',
    tmsecp256k1: 'tmsecp256k1'
};

export class WrapWallet {
    private signType;
    private hdPath:HdPath;
    public mnemonic;

    constructor(type, coinType, mnemonic,  options) {
        this.mnemonic = mnemonic;
        this.signType = WrapWallet.isEthSecp256k1(type) ? SIGN_TYPE.ethsecp256k1 : SIGN_TYPE.tmsecp256k1;
        const currentCoinType = coinType || "118";
        this.hdPath = [
            Slip10RawIndex.hardened(44),
            Slip10RawIndex.hardened(Number(currentCoinType)),
            Slip10RawIndex.hardened(0),
            Slip10RawIndex.normal(0),
            Slip10RawIndex.normal(0),
          ];
    }

    static async fromMnemonic(type: string, coinType: string, mnemonic: string, options?: Partial<DirectSecp256k1HdWalletOptions>): Promise<WrapWallet>{
        return new WrapWallet(type, coinType, mnemonic,  {
            ...options,
        });
    }

    static async generate(type, length, options = {}) {
        if (WrapWallet.isEthSecp256k1(type)){
            return EthSecp256k1HdWallet.generate(length, options);
        }
        return DirectSecp256k1HdWallet.generate(length, options);
    }

    static isEthSecp256k1(type){
        if (typeof type !== "undefined" && type !== null && type !== "" && type === SIGN_TYPE.ethsecp256k1){
            return true;
        }
        return false;
    }

    async signDirect(signerAddress, signDoc) {
        let wallet = await this.getWallet();
        return wallet.signDirect(signerAddress, signDoc);
    }

    async signAmino(signerAddress, signDoc) {
        let wallet = (this.signType === SIGN_TYPE.ethsecp256k1) ? (await EthSecp256k1HdWallet.fromMnemonic(this.mnemonic, {
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
        if (this.signType !== SIGN_TYPE.ethsecp256k1){
            return DirectSecp256k1HdWallet.fromMnemonic(this.mnemonic, {
                hdPaths: [this.hdPath],
                prefix: global.workspaceChain.addressPrefix,
            },);
        }
        return EthSecp256k1HdWallet.fromMnemonic(this.mnemonic, {
            hdPaths: [this.hdPath],
            prefix: global.workspaceChain.addressPrefix,
        },);
    }

}
exports.WrapWallet = WrapWallet;
