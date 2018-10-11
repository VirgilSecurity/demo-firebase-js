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

    async bootstrap(password: string) {
        this._encryptionClient = this.initClient();
        try {
            const encryptionClient = await this._bootstrapWithPassword(password);
            this.encryptionEmitter.emit('init', encryptionClient);
        } catch (e) {
            this.encryptionEmitter.emit('error', e);
            throw e;
        }
    }

   private  async _bootstrapWithPassword(password: string): Promise<EncryptionClient> {
        let privateKey: VirgilPrivateKey | null,
            publicKeys: VirgilPublicKey[],
            publicKey: VirgilPublicKey;

        privateKey = await this.keyLoader.loadPrivateKey(password);
        publicKeys = await this.toolbox.getPublicKeys(this.identity);

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
                const keyPair = this.toolbox.virgilCrypto.generateKeys()
                publicKey = keyPair.publicKey;
                privateKey = keyPair.privateKey;
                await this.keyLoader.savePrivateKey(privateKey, password);
            }
            return new EncryptionClient(privateKey, [publicKey], this.toolbox.virgilCrypto);
        }
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
