import { VirgilPublicKey, VirgilPrivateKey } from 'virgil-crypto';
import { KeyknoxLoader } from './KeyLoaders';
import { EncryptionClient } from './VirgilClient';
import VirgilToolbox from './virgilToolbox';
import EventEmitter from 'wolfy87-eventemitter';
import { VirgilReceiver } from './VirgilReciever';

export default class VirgilE2ee {
    toolbox: VirgilToolbox;
    keyLoader: KeyknoxLoader;
    private _encryptionClient?: Promise<EncryptionClient>;
    private _receiverStore: VirgilReceiver[] = [];
    private encryptionEmitter = new EventEmitter();

    get encryptionClient() {
        if (!this._encryptionClient) throw new Error('sign in or sign up first');
        return this._encryptionClient;
    }

    constructor(public identity: string, public getToken: (identity: string) => Promise<string>) {
        this.toolbox = new VirgilToolbox(identity, getToken);
        this.keyLoader = new KeyknoxLoader(this.toolbox);
    }

    async bootstrap(password?: string) {
        this._encryptionClient = this.initClient();
        try {
            const client = password ?
                await this._bootstrapWithPassword(password) :
                await this._bootstrapWithoutPassword();

            this.encryptionEmitter.emit('init', client);
        } catch (e) {
            this.encryptionEmitter.emit('error', e);
            throw e;
        }
    }

    async _bootstrapWithoutPassword() {
        let privateKey: VirgilPrivateKey | null, publicKeys: VirgilPublicKey[];

        [privateKey, publicKeys] = await this.loadKeys();

        if (publicKeys.length > 1) {
            if (privateKey) {
                const publicKey = this.toolbox.virgilCrypto.extractPublicKey(privateKey);
                publicKeys.push(publicKey);
                return new EncryptionClient(privateKey, publicKeys, this.toolbox.virgilCrypto);
            } else {
                throw new Error('Password required');
            }
        } else {
            if (privateKey) {
                const publicKey = this.toolbox.virgilCrypto.extractPublicKey(privateKey);
                await this.toolbox.createCard({ publicKey, privateKey });
                return new EncryptionClient(privateKey, publicKeys, this.toolbox.virgilCrypto);
            } else {
                throw new Error('Password required');
            }
        }
    }

    async _bootstrapWithPassword(password: string): Promise<EncryptionClient> {
        let privateKey: VirgilPrivateKey | null,
            publicKeys: VirgilPublicKey[],
            publicKey: VirgilPublicKey;

        [privateKey, publicKeys] = await this.loadKeys();

        if (publicKeys.length > 0) {
            if (privateKey) {
                return new EncryptionClient(privateKey, publicKeys, this.toolbox.virgilCrypto);
            } else {
                privateKey = await this.keyLoader.loadPrivateKey(password);
                if (privateKey) {
                    publicKey = this.toolbox.virgilCrypto.extractPublicKey(privateKey);
                    await this.toolbox.createCard({ privateKey, publicKey });
                } else {
                    const keyPair = await this.toolbox.createCard();
                    publicKey = keyPair.publicKey;
                    privateKey = keyPair.privateKey;
                }
                publicKeys.push(publicKey);
                return new EncryptionClient(privateKey, publicKeys, this.toolbox.virgilCrypto);
            }
        } else {
            privateKey = await this.keyLoader.loadPrivateKey(password);
            if (privateKey) {
                publicKey = this.toolbox.virgilCrypto.extractPublicKey(privateKey);
                await this.toolbox.createCard({ privateKey, publicKey });
            } else {
                const keyPair = await this.toolbox.createCard();
                publicKey = keyPair.publicKey;
                privateKey = keyPair.privateKey;
            }
            return new EncryptionClient(privateKey, [publicKey], this.toolbox.virgilCrypto);
        }
    }

    private async loadKeys() {
        return await Promise.all([
            this.keyLoader.loadLocalPrivateKey(),
            this.toolbox.getPublicKeys(this.identity),
        ]);
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
            receiver = new VirgilReceiver(username, this.toolbox);
            this._receiverStore.push(receiver);
        }
        return receiver;
    }

    getPublicKeys(username: string) {
        return this.toolbox.getPublicKeys(username);
    }

    private initClient = () => {
        return new Promise((resolve, reject) => {
            this.encryptionEmitter.once('init', resolve);
            this.encryptionEmitter.once('error', reject);
        }) as Promise<EncryptionClient>;
    };
}
