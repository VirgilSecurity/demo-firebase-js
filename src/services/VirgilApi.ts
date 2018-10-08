import { VirgilCrypto, VirgilCardCrypto } from 'virgil-crypto/dist/virgil-crypto-pythia.es';
import { VirgilPublicKey, VirgilPrivateKeyExporter, VirgilPrivateKey } from 'virgil-crypto';
import {
    VirgilCardVerifier,
    CachingJwtProvider,
    CardManager,
    PrivateKeyStorage,
    KeyEntryStorage,
} from 'virgil-sdk';
import { PrivateKeyLoader, KeyLoader } from './KeyLoaders';

export class VirgilToolbox {
    static jwtEndpoint = 'https://YOUR_ENDPOINT.cloudfunctions.net/api/generate_jwt';

    identity: string;
    virgilCrypto = new VirgilCrypto();
    keyEntryStorage = new KeyEntryStorage({ name: 'demo-firebase-js' });
    keyStorage = new PrivateKeyStorage(
        new VirgilPrivateKeyExporter(this.virgilCrypto),
        this.keyEntryStorage,
    );
    cardCrypto = new VirgilCardCrypto(this.virgilCrypto);
    cardVerifier = new VirgilCardVerifier(this.cardCrypto);
    cardManager: CardManager;
    jwtProvider: CachingJwtProvider;

    constructor(identity: string, public getToken: (identity: string) => Promise<string>) {
        this.identity = identity;

        const getJwt = () => this.getToken(identity);
        this.jwtProvider = new CachingJwtProvider(getJwt);

        this.cardManager = new CardManager({
            cardCrypto: this.cardCrypto,
            cardVerifier: this.cardVerifier,
            accessTokenProvider: this.jwtProvider,
            retryOnUnauthorized: true,
        });
    }

    async createCard() {
        const keyPair = this.virgilCrypto.generateKeys();

        await this.cardManager.publishCard({
            privateKey: keyPair.privateKey,
            publicKey: keyPair.publicKey,
        });

        return keyPair;
    }

    getPublicKeys = async (identity: string) => {
        const cards = await this.cardManager.searchCards(identity);
        const publicKeys = cards.map(card => card.publicKey as VirgilPublicKey);
        return publicKeys;
    };
}

export class Receiver {
    private _publicKeys?: Promise<VirgilPublicKey[]>;

    constructor(public username: string, readonly toolbox: VirgilToolbox) {}

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
            [...(await receiver.publicKeys), ...this.publicKeys] as VirgilPublicKey[],
        );

        return encryptedData.toString('base64');
    }

    async decrypt(message: string) {
        const decryptedData = this.virgilCrypto.decrypt(message, this.privateKey);
        return decryptedData.toString('utf8');
    }
}

export default class Facade {
    virgilToolbox: VirgilToolbox;
    keyLoader: KeyLoader;
    private _encryptionClient?: Promise<EncryptionClient>;
    private _receiverStore: Receiver[] = [];

    get encryptionClient() {
        if (!this._encryptionClient) throw Error('sign up or sign in first');
        return this._encryptionClient;
    }

    constructor(public identity: string, public getToken: (identity: string) => Promise<string>) {
        this.virgilToolbox = new VirgilToolbox(identity, getToken);
        this.keyLoader = new PrivateKeyLoader(this.virgilToolbox);
    }

    use(loader: KeyLoader) {
        this.keyLoader = loader;
    }

    async signUp() {
        const keyPair = this.virgilToolbox.createCard();
        const promise = keyPair.then(({ privateKey, publicKey }) => ({
            privateKey,
            publicKeys: [publicKey],
        }));
        this._encryptionClient = this.initClient(promise) as Promise<EncryptionClient>;
        try {
            const { privateKey } = await keyPair;
            this.keyLoader.savePrivateKey(privateKey);
        } catch (e) {
            throw e;
        }

        return this._encryptionClient;
    }

    async signIn() {
        const keyPair = Promise.all([
            this.keyLoader.loadPrivateKey(),
            this.virgilToolbox.getPublicKeys(this.identity),
        ]).then(([privateKey, publicKeys]) => ({ privateKey, publicKeys }));
        this._encryptionClient = this.initClient(keyPair) as Promise<EncryptionClient>;
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

    async initClient(
        promise: Promise<{ privateKey: VirgilPrivateKey; publicKeys: VirgilPublicKey[] }>,
    ) {
        return new Promise((resolve, reject) => {
            promise
                .then(({ privateKey, publicKeys }) => {
                    const client = new EncryptionClient(
                        privateKey,
                        publicKeys,
                        this.virgilToolbox.virgilCrypto,
                    );
                    resolve(client);
                })
                .catch(reject);
        });
    }
}
