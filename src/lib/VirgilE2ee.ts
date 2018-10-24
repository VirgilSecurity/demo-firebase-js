import { VirgilPublicKey, VirgilPrivateKey } from 'virgil-crypto';
import KeyknoxLoader from './KeyknoxLoader';
import { EncryptionClient } from './VirgilClient';
import VirgilToolbox from './virgilToolbox';
import EventEmitter from 'wolfy87-eventemitter';
import { VirgilReceiver } from './VirgilReciever';
import { Jwt } from 'virgil-sdk';

export class AsyncProperty<T> extends EventEmitter {
    private promise: Promise<T>;
    private isInitialized: boolean = false;

    constructor(private message?: string) {
        super();
        this.promise = this.initPromise();
    }

    init = (instance: T) => {
        if (this.isInitialized) this.promise = this.initPromise();
        this.isInitialized = true;
        this.emit('init', instance);
    };

    fail = (e: Error | string) => {
        this.emit('error', e);
        return e;
    };

    get = (): Promise<T> => {
        if (!this.isInitialized && this.message) throw this.message;
        return this.promise;
    };

    fromPromise = (promise: Promise<T>) => {
        this.isInitialized = true;
        this.promise = promise;
    };

    private initPromise(): Promise<T> {
        return new Promise((resolve, reject) => {
            this.once('init', resolve);
            this.once('error', reject);
        });
    }
}

export default class VirgilE2ee {
    private identity?: Promise<string>;
    private toolbox = new VirgilToolbox(this.getToken);
    private keyLoader?: Promise<KeyknoxLoader>;
    private encryptor = new AsyncProperty<EncryptionClient>('bootstrap first');
    private _receiverStore: VirgilReceiver[] = [];

    constructor(public getToken: () => Promise<string>) {}

    async init() {
        this.identity = this.getToken().then(token => Jwt.fromString(token).identity());
        this.keyLoader = this.identity.then(identity => {
            return new KeyknoxLoader(identity, this.toolbox)
        })
        return this.identity;
    }

    bootstrap(password: string) {
        this._bootstrapWithPassword(password)
            .then(this.encryptor.init)
            .catch(this.encryptor.fail);

        return this;
    }

    private async _bootstrapWithPassword(password: string): Promise<EncryptionClient> {
        if (!this.identity || !this.keyLoader) throw new Error('init first');
        const [keyLoader, identity] = await Promise.all([
            this.keyLoader,
            this.identity,
        ]);

        let [privateKey, publicKeys] = await Promise.all([
            keyLoader.loadPrivateKey(password),
            this.toolbox.getPublicKeys(identity),
        ]);

        let publicKey: VirgilPublicKey;

        if (privateKey) {
            if (publicKeys.length > 0) {
                return new EncryptionClient(privateKey, publicKeys, this.toolbox.virgilCrypto);
            } else {
                publicKey = this.toolbox.virgilCrypto.extractPublicKey(privateKey);
                await this.toolbox.createCard({ privateKey, publicKey });
                return new EncryptionClient(privateKey, [publicKey], this.toolbox.virgilCrypto);
            }
        } else {
            if (publicKeys.length > 0) {
                throw new Error('private key not found');
            } else {
                const keyPair = this.toolbox.virgilCrypto.generateKeys();
                publicKey = keyPair.publicKey;
                privateKey = keyPair.privateKey;
                await keyLoader.savePrivateKey(privateKey, password);
            }
            return new EncryptionClient(privateKey, [publicKey], this.toolbox.virgilCrypto);
        }
    }

    async encrypt(message: string, username: string) {
        const client = await this.encryptor.get();
        const receiver = await this.getReceiver(username);
        return client.encrypt(message, await receiver.publicKeys);
    }

    async decrypt(message: string) {
        const client = await this.encryptor.get();
        return client.decrypt(message);
    }

    getReceiver(username: string) {
        let receiver = this._receiverStore.find(r => r.username === username);
        if (!receiver) {
            receiver = new VirgilReceiver(username, this.toolbox);
            this._receiverStore.push(receiver);
        }
        return receiver;
    }

    getPublicKeys(username: string) {
        return this.toolbox.getPublicKeys(username);
    }
}
