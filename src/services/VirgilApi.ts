import {
    VirgilCrypto,
    VirgilCardCrypto,
    VirgilPublicKey,
    VirgilPrivateKeyExporter,
    VirgilPrivateKey,
} from 'virgil-crypto';
import { VirgilCardVerifier, CachingJwtProvider, CardManager, PrivateKeyStorage } from 'virgil-sdk';

class VirgilToolbox {
    static jwtEndpoint = 'https://YOUR_ENDPOINT.cloudfunctions.net/api/generate_jwt';

    identity: string;
    virgilCrypto = new VirgilCrypto();
    keyStorage = new PrivateKeyStorage(new VirgilPrivateKeyExporter(this.virgilCrypto));
    cardCrypto = new VirgilCardCrypto(this.virgilCrypto);
    cardVerifier = new VirgilCardVerifier(this.cardCrypto);
    cardManager: CardManager;

    constructor(identity: string, public getToken: (identity: string) => Promise<string>) {
        this.identity = identity;

        const getJwt = () => this.getToken(identity);
        const jwtProvider = new CachingJwtProvider(getJwt);

        this.cardManager = new CardManager({
            cardCrypto: this.cardCrypto,
            cardVerifier: this.cardVerifier,
            accessTokenProvider: jwtProvider,
            retryOnUnauthorized: true,
        });
    }

    async createCard() {
        const keyPair = this.virgilCrypto.generateKeys();

        const card = await this.cardManager.publishCard({
            privateKey: keyPair.privateKey,
            publicKey: keyPair.publicKey,
        });

        return { card, keyPair };
    }

    getPublicKeys = async (identity: string) => {
        const cards = await this.cardManager.searchCards(identity);
        const publicKeys = cards.map(card => card.publicKey as VirgilPublicKey);
        return publicKeys;
    };
}

export class Receiver {
    private _publicKeys?: Promise<VirgilPublicKey[]>;

    constructor(public username: string, readonly toolbox: VirgilToolbox) {

    }

    get publicKeys(): Promise<VirgilPublicKey[]> {
        if (this._publicKeys) return this._publicKeys;
        return this.toolbox.getPublicKeys(this.username);
    }

    preloadKeys() {
        this._publicKeys = this.toolbox.getPublicKeys(this.username);
    }
}

export class EncryptionClient {
    constructor(
        private privateKey: VirgilPrivateKey,
        private publicKeys: VirgilPublicKey[],
        private virgilCrypto: VirgilCrypto,
    ) {}

    async encrypt(message: string, receiver: Receiver) {
        const encryptedData = this.virgilCrypto.encrypt(
            message,
            // encrypted public keys of sender are added to add possibility to decrypt
            // message from other device
            [...await receiver.publicKeys, ...this.publicKeys] as VirgilPublicKey[],
        );

        return encryptedData.toString('base64');
    }

    async decrypt(message: string) {
        const decryptedData = this.virgilCrypto.decrypt(message, this.privateKey);
        return decryptedData.toString('utf8');
    }
}

class PrivateKeyLoader {
    constructor(public sdk: VirgilToolbox) {}

    async loadPrivateKey() {
        const privateKeyData = await this.sdk.keyStorage.load(this.sdk.identity);
        if (!privateKeyData) throw new Error('key not found');
        return privateKeyData.privateKey as VirgilPrivateKey;
    }

    savePrivateKey(privateKey: VirgilPrivateKey) {
        this.sdk.keyStorage.store(this.sdk.identity, privateKey);
    }
}

export default class Facade {
    virgilToolbox: VirgilToolbox;
    privateKeyLoader: PrivateKeyLoader;
    private _encryptionClient?: EncryptionClient;
    private _receiverStore: Receiver[] = [];

    get encryptionClient() {
        if (!this._encryptionClient) return this.signIn();
        return Promise.resolve(this._encryptionClient);
    }

    constructor(public identity: string, public getToken: (identity: string) => Promise<string>) {
        this.virgilToolbox = new VirgilToolbox(identity, getToken);
        this.privateKeyLoader = new PrivateKeyLoader(this.virgilToolbox);
    }

    async signUp() {
        try {
            const { keyPair } = await this.virgilToolbox.createCard();
            await this.privateKeyLoader.savePrivateKey(keyPair.privateKey);
            this._encryptionClient = new EncryptionClient(
                keyPair.privateKey,
                [keyPair.publicKey],
                this.virgilToolbox.virgilCrypto,
            );
        } catch (e) {
            throw e;
        }

        return this._encryptionClient;
    }

    async signIn() {
        const privateKey = await this.privateKeyLoader.loadPrivateKey();
        const publicKeys = await this.virgilToolbox.getPublicKeys(this.identity);
        this._encryptionClient = new EncryptionClient(privateKey, publicKeys, this.virgilToolbox.virgilCrypto);
        return this._encryptionClient;
    }

    async encrypt(message: string, username: string) {
        const client = await this.encryptionClient;
        return client.encrypt(message, this.getReceiver(username));
    }

    async decrypt(message: string) {
        const client = await this.encryptionClient;
        return client.decrypt(message); 
    }

    getReceiver(username: string) {
        let receiver = this._receiverStore.find(r => r.username === username);
        if (!receiver) {
            receiver = new Receiver(username, this.virgilToolbox);
            this._receiverStore.push(receiver);
        }
        return receiver;
    }
}
