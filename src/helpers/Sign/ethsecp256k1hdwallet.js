"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.EthSecp256k1HdWallet = exports.extractKdfConfiguration = void 0;
const amino_1 = require("@cosmjs/amino");
const crypto_1 = require("@cosmjs/crypto");
const encoding_1 = require("@cosmjs/encoding");
const utils_1 = require("@cosmjs/utils");
const signing_1 = require("@cosmjs/proto-signing/build/signing");
const signing_2 = require("@cosmjs/amino/build/signdoc");
const wallet_1 = require("@cosmjs/proto-signing/build/wallet");
const serializationTypeV1 = "directsecp256k1hdwallet-v1";
const web3 = require('web3'); 
const buffer = require('buffer'); 
const ethers = require('ethers');
const crypto_2 = require("./crypto/index");


/**
 * A KDF configuration that is not very strong but can be used on the main thread.
 * It takes about 1 second in Node.js 16.0.0 and should have similar runtimes in other modern Wasm hosts.
 */
const basicPasswordHashingOptions = {
    algorithm: "argon2id",
    params: {
        outputLength: 32,
        opsLimit: 24,
        memLimitKib: 12 * 1024,
    },
};
function isDerivationJson(thing) {
    if (!(0, utils_1.isNonNullObject)(thing))
        return false;
    if (typeof thing.hdPath !== "string")
        return false;
    if (typeof thing.prefix !== "string")
        return false;
    return true;
}
function extractKdfConfigurationV1(doc) {
    return doc.kdf;
}
function extractKdfConfiguration(serialization) {
    const root = JSON.parse(serialization);
    if (!(0, utils_1.isNonNullObject)(root))
        throw new Error("Root document is not an object.");
    switch (root.type) {
        case serializationTypeV1:
            return extractKdfConfigurationV1(root);
        default:
            throw new Error("Unsupported serialization type");
    }
}
exports.extractKdfConfiguration = extractKdfConfiguration;

// m/44'/118'/0'/0/0
// m/44'/60'/0'/0/0
// const path = stringToPath("m/44'/118'/0'/0/0");
// var pathArray = [path];

// hdPaths: pathArray,

const defaultOptions = {
    bip39Password: "",
    hdPaths: [(0, amino_1.makeCosmoshubPath)(0)],
    prefix: "cosmos",
};
/** A wallet for protobuf based signing using SIGN_MODE_DIRECT */
class EthSecp256k1HdWallet {
    constructor(mnemonic, options) {
        var _a, _b;
        const prefix = (_a = options.prefix) !== null && _a !== void 0 ? _a : defaultOptions.prefix;
        const hdPaths = (_b = options.hdPaths) !== null && _b !== void 0 ? _b : defaultOptions.hdPaths;
        this.secret = mnemonic;
        this.accounts = hdPaths.map((hdPath) => ({
            hdPath: hdPath,
            prefix: prefix,
        }));
    }
    /**
     * Restores a wallet from the given BIP39 mnemonic.
     *
     * @param mnemonic Any valid English mnemonic.
     * @param options An optional `EthSecp256k1HdWalletOptions` object optionally containing a bip39Password, hdPaths, and prefix.
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
     * @param options An optional `EthSecp256k1HdWalletOptions` object optionally containing a bip39Password, hdPaths, and prefix.
     */
    static async generate(length = 12, options = {}) {
        const entropyLength = 4 * Math.floor((11 * length) / 33);
        const entropy = crypto_1.Random.getBytes(entropyLength);
        const mnemonic = crypto_1.Bip39.encode(entropy);
        return EthSecp256k1HdWallet.fromMnemonic(mnemonic.toString(), options);
    }
    /**
     * Restores a wallet from an encrypted serialization.
     *
     * @param password The user provided password used to generate an encryption key via a KDF.
     *                 This is not normalized internally (see "Unicode normalization" to learn more).
     */
    static async deserialize(serialization, password) {
        throw new Error("Todo, deserialize");
    }
    /**
     * Restores a wallet from an encrypted serialization.
     *
     * This is an advanced alternative to calling `deserialize(serialization, password)` directly, which allows
     * you to offload the KDF execution to a non-UI thread (e.g. in a WebWorker).
     *
     * The caller is responsible for ensuring the key was derived with the given KDF configuration. This can be
     * done using `extractKdfConfiguration(serialization)` and `executeKdf(password, kdfConfiguration)` from this package.
     */
    static async deserializeWithEncryptionKey(serialization, encryptionKey) {
        throw new Error("Todo, deserializeWithEncryptionKey");
    }
    static async deserializeTypeV1(serialization, password) {
        throw new Error("Todo, deserializeTypeV1");
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
        const accounts = await this.getAccountsWithPrivkeys();
        const account = accounts.find(({ address }) => address === signerAddress);
        if (account === undefined) {
            throw new Error(`Address ${signerAddress} not found in wallet`);
        }
        const { privkey, pubkey } = account;
        
        // let sha3Msg = Buffer.from((0, signing_1.makeSignBytes)(signDoc));
        // const hash = web3.utils.sha3(sha3Msg);
        // console.log(sha3Msg.toString('hex'));
        // console.log(hash.toString());
        // console.log(this.buf2hex(pubkey.buffer));
        // const signature = await crypto_1.Secp256k1.createSignature(Uint8Array.from(Buffer.from(hash.substring(2),'hex')), privkey);
        // const signatureBytes = new Uint8Array([...signature.r(32), ...signature.s(32)]);
        // return {
        //     signed: signDoc, signature: (0, amino_1.encodeSecp256k1Signature)(pubkey, signatureBytes),
        // };

        // const signBytes = (0, signing_1.makeSignBytes)(signDoc);
        // const hashedMessage = (0, crypto_1.sha256)(signBytes);
        // const signature = await crypto_1.Secp256k1.createSignature(hashedMessage, privkey);
        // const signatureBytes = new Uint8Array([...signature.r(32), ...signature.s(32)]);
        // const stdSignature = (0, amino_1.encodeSecp256k1Signature)(pubkey, signatureBytes);
        // return {
        //     signed: signDoc,
        //     signature: stdSignature,
        // };

        // const accounts = await this.getAccountsWithPrivkeys();
        // const account = accounts.find(({ address }) => address === signerAddress);
        // if (account === undefined) {
        //     throw new Error(`Address ${signerAddress} not found in wallet`);
        // }
        // const { privkey, pubkey } = account;
        const signBytes = (0, signing_1.makeSignBytes)(signDoc);
        const hashedMessage = (0, crypto_1.sha256)(signBytes);
        const signature = await crypto_1.Secp256k1.createSignature(hashedMessage, privkey);
        const signatureBytes = new Uint8Array([...signature.r(32), ...signature.s(32)]);
        const stdSignature = (0, amino_1.encodeSecp256k1Signature)(pubkey, signatureBytes);
        return {
            signed: signDoc,
            signature: stdSignature,
        };
    }

    async buf2hex(buffer) {
        return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
    }

    async signAmino(signerAddress, signDoc) {
        const accounts = await this.getAccountsWithPrivkeys();
        const account = accounts.find(({ address }) => address === signerAddress);
        if (account === undefined) {
            throw new Error(`Address ${signerAddress} not found in wallet`);
        }
        const { privkey, pubkey } = account;
        const message = web3.utils.sha3(Buffer.from((0, signing_2.serializeSignDoc)(signDoc)));
        const signature = await crypto_1.Secp256k1.createSignature(Uint8Array.from(Buffer.from(message.substring(2),'hex')), privkey);
        const signatureBytes = new Uint8Array([...signature.r(32), ...signature.s(32)]);
        return {
            signed: signDoc, signature: (0, amino_1.encodeSecp256k1Signature)(pubkey, signatureBytes),
        };
    }

    /**
     * Generates an encrypted serialization of this wallet.
     *
     * @param password The user provided password used to generate an encryption key via a KDF.
     *                 This is not normalized internally (see "Unicode normalization" to learn more).
     */
    async serialize(password) {
        throw new Error("Todo, serialize");
    }
    /**
     * Generates an encrypted serialization of this wallet.
     *
     * This is an advanced alternative to calling `serialize(password)` directly, which allows you to
     * offload the KDF execution to a non-UI thread (e.g. in a WebWorker).
     *
     * The caller is responsible for ensuring the key was derived with the given KDF options. If this
     * is not the case, the wallet cannot be restored with the original password.
     */
    async serializeWithEncryptionKey(encryptionKey, kdfConfiguration) {
        throw new Error("Todo, serializeWithEncryptionKey");
    }
    async getKeyPair(hdPath) {
        let privateK = crypto_2.getPrivateKeyFromMnemonic(this.secret, '60');
        let pubK = crypto_2.encodePubKeyToCompressedBuffer(crypto_2.getPubKeyFromPrivateKey(privateK));
        return {
            privkey: privateK,
            pubkey: Uint8Array.from(pubK),
        };
    }
    async getAccountsWithPrivkeys() {
        return Promise.all(this.accounts.map(async ({ hdPath, prefix }) => {
            const { privkey, pubkey } = await this.getKeyPair(hdPath);
            const address = crypto_2.getAddressFromPrivateKey(privkey);;
            return {
                algo: "secp256k1",
                privkey: privkey,
                pubkey: pubkey,
                address: address,
            };
        }));
    }
}
exports.EthSecp256k1HdWallet = EthSecp256k1HdWallet;
//# sourceMappingURL=directsecp256k1hdwallet.js.map