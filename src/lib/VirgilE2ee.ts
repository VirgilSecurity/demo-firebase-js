import { VirgilPublicKey, VirgilPrivateKey } from 'virgil-crypto';
import { LocalLoader, KeyLoader, KeyknoxLoader } from './KeyLoaders';
import { EncryptionClient } from './VirgilClient';
import VirgilToolbox from './virgilToolbox';
import EventEmitter from 'wolfy87-eventemitter';
import { VirgilReceiver } from './VirgilReciever';
import { CloudEntryDoesntExistError } from '@virgilsecurity/keyknox';

export default class VirgilE2ee {
    virgilToolbox: VirgilToolbox;
    keyLoader: KeyLoader;
    private _encryptionClient?: Promise<EncryptionClient>;
    private _receiverStore: VirgilReceiver[] = [];
    private encryptionEmitter = new EventEmitter();

    private get encryptionClient() {
        if (!this._encryptionClient) throw new Error('sign in or sign up first');
        return this._encryptionClient;
    }

    constructor(public identity: string, public getToken: (identity: string) => Promise<string>) {
        this.virgilToolbox = new VirgilToolbox(identity, getToken);
        this.keyLoader = new LocalLoader(this.virgilToolbox);
    }

    async bootstrap(password?: string) {
        this._encryptionClient = this.initClient();
        if (password) this.keyLoader = new KeyknoxLoader(this.virgilToolbox, password);

        let privateKey: VirgilPrivateKey | null, publicKeys: VirgilPublicKey[];

        try {
            [privateKey, publicKeys] = await Promise.all([
                this.keyLoader.loadPrivateKey().catch(e => {
                    if (e instanceof CloudEntryDoesntExistError) return null;
                    else throw e;
                }),
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
            receiver = new VirgilReceiver(username, this.virgilToolbox);
            this._receiverStore.push(receiver);
        }
        return receiver;
    }

    getPublicKeys(username: string) {
        return this.virgilToolbox.getPublicKeys(username);
    }


    private initClient = () => {
        return new Promise((resolve, reject) => {
            this.encryptionEmitter.once('init', resolve);
            this.encryptionEmitter.once('error', reject);
        }) as Promise<EncryptionClient>;
    };
}
