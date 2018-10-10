import { VirgilCrypto, VirgilCardCrypto } from 'virgil-crypto/dist/virgil-crypto-pythia.es';
import { VirgilPublicKey, VirgilPrivateKeyExporter, VirgilPrivateKey } from 'virgil-crypto';
import {
    VirgilCardVerifier,
    CachingJwtProvider,
    CardManager,
    PrivateKeyStorage,
    KeyEntryStorage,
} from 'virgil-sdk';
import { PrivateKeyLoader, KeyLoader, KeyknoxLoader } from './KeyLoaders';
import EventEmitter from 'wolfy87-eventemitter';

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
        private publicKey: VirgilPublicKey[],
        private virgilCrypto: VirgilCrypto,
    ) {}

    encrypt(message: string, publicKeys: VirgilPublicKey[]) {
        const encryptedData = this.virgilCrypto.encrypt(
            message,
            // encrypted public keys of sender are added to add possibility to decrypt
            // message from other device
            [...publicKeys, this.publicKey] as VirgilPublicKey[],
        );

        return encryptedData.toString('base64');
    }

    decrypt(message: string) {
        const decryptedData = this.virgilCrypto.decrypt(message, this.privateKey);
        return decryptedData.toString('utf8');
    }
}

export default class Facade {
    virgilToolbox: VirgilToolbox;
    keyLoader: KeyLoader;
    private _encryptionClient?: Promise<EncryptionClient>;
    private _receiverStore: Receiver[] = [];
    private encryptionEmitter = new EventEmitter();

    private get encryptionClient() {
        if (!this._encryptionClient) throw new Error('sign in or sign up first');
        return this._encryptionClient;
    }

    constructor(public identity: string, public getToken: (identity: string) => Promise<string>) {
        this.virgilToolbox = new VirgilToolbox(identity, getToken);
        this.keyLoader = new PrivateKeyLoader(this.virgilToolbox);
    }

    use(loader: KeyLoader) {
        this.keyLoader = loader;
    }

    async bootstrap(password?: string) {
        this._encryptionClient = this.initClient();
        if (password) this.use(new KeyknoxLoader(this.virgilToolbox, password));

        let privateKey: VirgilPrivateKey | null, publicKeys: VirgilPublicKey[];

        try {
            [privateKey, publicKeys] = await Promise.all([
                this.keyLoader.loadPrivateKey().catch(e => { console.log(e); return null }),
                this.virgilToolbox.getPublicKeys(this.identity),
            ]);

            if (!privateKey) {
                const keypair = await this.virgilToolbox.createCard();
                privateKey = keypair.privateKey;
                publicKeys = [...publicKeys, keypair.publicKey];
                await this.keyLoader.savePrivateKey(privateKey);
            }
        } catch (e) {
            this.encryptionEmitter.emit('error', e);
            throw e;
        }

        const client = new EncryptionClient(privateKey, publicKeys, this.virgilToolbox.virgilCrypto);
        this.encryptionEmitter.emit('init', client);
    }

    async encrypt(message: string, username: string) {
        const client = await this.encryptionClient;
        const receiver = this.getReceiver(username);
        return client.encrypt(message, await receiver.publicKeys);
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

    initClient = () => {
        return new Promise((resolve, reject) => {
            this.encryptionEmitter.once('init', resolve);
            this.encryptionEmitter.once('error', reject);
        }) as Promise<EncryptionClient>;
    };

    getPublicKeys(username: string) {
        return this.virgilToolbox.getPublicKeys(username);
    }
}
