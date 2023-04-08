"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const amino = require("@cosmjs/amino");
const crypto = require("@cosmjs/crypto");
const protosign = require("@cosmjs/proto-signing/build/signing");
const aminosign = require("@cosmjs/amino/build/signdoc");
const web3 = require('web3'); 
const ethers = require('ethers');

const defaultOptions = {
    bip39Password: "",
    hdPaths: [(0, amino.makeCosmoshubPath)(0)],
};

class EthSecp256k1HdWallet {
    constructor(mnemonic, options) {
        var _a;
        const hdPaths = (_a = options.hdPaths) !== null && _a !== void 0 ? _a : defaultOptions.hdPaths;
        this.secret = mnemonic;
        this.accounts = hdPaths.map((hdPath) => ({
            hdPath: hdPath,
        }));
    }
    /**
     * Restores a wallet from the given BIP39 mnemonic.
     *
     * @param mnemonic Any valid English mnemonic.
     * @param options An optional `DirectSecp256k1HdWalletOptions` object optionally containing a bip39Password, hdPaths
     */
    static async fromMnemonic(mnemonic, options = {}) {
        return new EthSecp256k1HdWallet(mnemonic, {
            ...options,
        });
    }
    /**
     * Generates a new wallet with a BIP39 mnemonic of the given length.
     *
     * @param length The number of words in the mnemonic (12, 15, 18, 21 or 24).
     * @param options An optional `DirectSecp256k1HdWalletOptions` object optionally containing a bip39Password, hdPaths, and prefix.
     */
    static async generate(length = 12, options = {}) {
        const entropyLength = 4 * Math.floor((11 * length) / 33);
        const entropy = crypto.Random.getBytes(entropyLength);
        const mnemonic = crypto.Bip39.encode(entropy);
        return EthSecp256k1HdWallet.fromMnemonic(mnemonic.toString(), options);
    }

    get mnemonic() {
        return this.secret;
    }

    async getAccounts() {
        const accountsWithPrivkeys = await this.getAccountsWithPrivkeys();
        return accountsWithPrivkeys.map(({ algo, pubkey, address }) => ({
            algo: algo,
            pubkey: pubkey,
            address: address,
        }));
    }

    async signDirect(signerAddress, signDoc) {
        return await this.signInternal(signerAddress, signDoc, false);
    }

    async signAmino(signerAddress, signDoc) {
        return await this.signInternal(signerAddress, signDoc, true);
    }

    async signInternal(signerAddress, signDoc, isAmino){
        const accounts = await this.getAccountsWithPrivkeys();
        const account = accounts.find(({ address }) => address === signerAddress);
        if (account === undefined) {
            throw new Error(`Address ${signerAddress} not found in wallet`);
        }
        const { privkey, pubkey } = account;
        let sha3Msg = Buffer.from((0, isAmino ? aminosign.serializeSignDoc : protosign.makeSignBytes)(signDoc));
        const hash = web3.utils.sha3(sha3Msg);
        const signature = await crypto.Secp256k1.createSignature(Uint8Array.from(Buffer.from(hash.substring(2),'hex')), privkey);
        const signatureBytes = new Uint8Array([...signature.r(32), ...signature.s(32)]);
        return {
            signed: signDoc, signature: (0, amino.encodeSecp256k1Signature)(pubkey, signatureBytes),
        };
    }

    async getAccountsWithPrivkeys() {
        return Promise.all(this.accounts.map(async ({ hdPath, prefix }) => {
            let ethWallet = ethers.Wallet.fromMnemonic(this.secret);
            return {
                algo: "ethsecp256k1",
                privkey: ethWallet.privateKey.substring(2),
                pubkey: Buffer.from(ethers.utils.computePublicKey(ethWallet.publicKey, true).substring(2), 'hex'),
                address: ethWallet.address,
            };
        }));
    }
}
exports.EthSecp256k1HdWallet = EthSecp256k1HdWallet;