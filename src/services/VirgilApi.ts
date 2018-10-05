import {
    VirgilCrypto,
    VirgilCardCrypto,
    VirgilPythiaCrypto,
} from 'virgil-crypto/dist/virgil-crypto-pythia.es';
import { VirgilPublicKey, VirgilPrivateKeyExporter, VirgilPrivateKey } from 'virgil-crypto';
import {
    VirgilCardVerifier,
    CachingJwtProvider,
    CardManager,
    PrivateKeyStorage,
    KeyEntryStorage,
} from 'virgil-sdk';

class VirgilToolbox {
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

// class PrivateKeyLoader {
//     constructor(public sdk: VirgilToolbox) {}

//     async loadPrivateKey() {
//         const privateKeyData = await this.sdk.keyStorage.load(this.sdk.identity);
//         if (!privateKeyData) throw new Error('key not found');
//         return privateKeyData.privateKey as VirgilPrivateKey;
//     }

//     savePrivateKey(privateKey: VirgilPrivateKey) {
//         this.sdk.keyStorage.store(this.sdk.identity, privateKey);
//     }
// }

import { createBrainKey } from 'virgil-pythia';
import {
    SyncKeyStorage,
    CloudKeyStorage,
    KeyknoxManager,
    KeyknoxCrypto,
} from '@virgilsecurity/keyknox';

interface IBrainKey {
    generateKeyPair(
        password: string,
        id?: string,
    ): Promise<{
        privateKey: VirgilPrivateKey;
        publicKey: VirgilPublicKey;
    }>;
}

class KeyknoxLoader {
    pythiaCrypto = new VirgilPythiaCrypto();
    brainKey: IBrainKey;
    storage?: SyncKeyStorage;

    constructor(public sdk: VirgilToolbox) {

    }

    async loadPrivateKey() {
        if (!this.storage) throw new Error('storage not exists');
        await this.storage.sync();
        const key = await this.storage.retrieveEntry(this.sdk.identity);
        console.log('loadPrivateKey', key);
        return this.sdk.virgilCrypto.importPrivateKey(key.value);
    }

    async savePrivateKey(privateKey: VirgilPrivateKey) {
        if (!this.storage) throw new Error('storage not exists');
        console.log('savePrivateKey', await this.storage.retrieveAllEntries);
        await this.storage.sync();
        await this.storage.storeEntry(this.sdk.identity, this.sdk.virgilCrypto.exportPrivateKey(privateKey))
        // tslint:disable-next-line:no-console
        console.log('savePrivateKey', await this.storage.retrieveAllEntries);
    }

    async createSyncStorage(password: string, id?: string) {
        const { privateKey, publicKey } = await createBrainKey({
            virgilCrypto: this.sdk.virgilCrypto,
            virgilPythiaCrypto: this.pythiaCrypto,
            accessTokenProvider: this.sdk.jwtProvider,
        }).generateKeyPair(password, id);
        this.storage = new SyncKeyStorage(
            new CloudKeyStorage(
                new KeyknoxManager(
                    this.sdk.jwtProvider,
                    privateKey,
                    publicKey,
                    undefined,
                    new KeyknoxCrypto(this.sdk.virgilCrypto),
                ),
            ),
            this.sdk.keyEntryStorage,
        );
    }
}

export default class Facade {
    virgilToolbox: VirgilToolbox;
    privateKeyLoader: KeyknoxLoader;
    private _encryptionClient?: EncryptionClient;
    private _receiverStore: Receiver[] = [];

    get encryptionClient() {
        if (!this._encryptionClient)
            return this.privateKeyLoader.createSyncStorage('qwerty123').then(() => this.signIn());
        return Promise.resolve(this._encryptionClient);
    }

    constructor(public identity: string, public getToken: (identity: string) => Promise<string>) {
        this.virgilToolbox = new VirgilToolbox(identity, getToken);
        this.privateKeyLoader = new KeyknoxLoader(this.virgilToolbox);
    }

    async signUp() {
        try {
            const { keyPair } = await this.virgilToolbox.createCard();
            await this.privateKeyLoader.savePrivateKey(keyPair.privateKey);
            console.log('signUp')
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
        this._encryptionClient = new EncryptionClient(
            privateKey,
            publicKeys,
            this.virgilToolbox.virgilCrypto,
        );
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
