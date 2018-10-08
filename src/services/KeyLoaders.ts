import { createBrainKey } from 'virgil-pythia';
import {
    SyncKeyStorage,
    CloudKeyStorage,
    KeyknoxManager,
    KeyknoxCrypto,
} from '@virgilsecurity/keyknox';
import { VirgilPythiaCrypto } from 'virgil-crypto/dist/virgil-crypto-pythia.es';
import { VirgilToolbox } from './VirgilApi';
import { VirgilPrivateKey, VirgilPublicKey } from 'virgil-crypto';
import { KeyEntryStorage } from 'virgil-sdk';

export abstract class KeyLoader {
    constructor(public sdk: VirgilToolbox) {}

    abstract savePrivateKey(privateKey: VirgilPrivateKey): void;
    abstract loadPrivateKey(): Promise<VirgilPrivateKey>;
}

export class PrivateKeyLoader extends KeyLoader {
    constructor(public sdk: VirgilToolbox) {
        super(sdk);
    }

    async loadPrivateKey() {
        const privateKeyData = await this.sdk.keyStorage.load(this.sdk.identity);
        if (!privateKeyData) throw new Error('key not found');
        return privateKeyData.privateKey as VirgilPrivateKey;
    }

    savePrivateKey(privateKey: VirgilPrivateKey) {
        this.sdk.keyStorage.store(this.sdk.identity, privateKey);
    }
}

export interface IBrainKey {
    generateKeyPair(
        password: string,
        id?: string,
    ): Promise<{
        privateKey: VirgilPrivateKey;
        publicKey: VirgilPublicKey;
    }>;
}

export class KeyknoxLoader extends KeyLoader {
    pythiaCrypto = new VirgilPythiaCrypto();
    brainKey: IBrainKey;
    storage: Promise<SyncKeyStorage>;

    constructor(public sdk: VirgilToolbox, password: string, id?: string) {
        super(sdk);
        this.brainKey = createBrainKey({
            virgilCrypto: this.sdk.virgilCrypto,
            virgilPythiaCrypto: this.pythiaCrypto,
            accessTokenProvider: this.sdk.jwtProvider,
        });

        this.storage = this.createSyncStorage(password, id);
    }

    async loadPrivateKey() {
        const storage = await this.storage;
        const key = await storage.retrieveEntry(this.sdk.identity);
        return this.sdk.virgilCrypto.importPrivateKey(key.value);
    }

    async savePrivateKey(privateKey: VirgilPrivateKey) {
        const storage = await this.storage;
        await storage.storeEntry(
            this.sdk.identity,
            this.sdk.virgilCrypto.exportPrivateKey(privateKey),
        );
    }

    private async createSyncStorage(password: string, id?: string) {
        const { privateKey, publicKey } = await this.brainKey.generateKeyPair(password, id);
        const storage = new SyncKeyStorage(
            new CloudKeyStorage(
                new KeyknoxManager(
                    this.sdk.jwtProvider,
                    privateKey,
                    publicKey,
                    undefined,
                    new KeyknoxCrypto(this.sdk.virgilCrypto),
                ),
            ),
            new KeyEntryStorage({ name: 'demo-firebase-js-keyknox' })
        );

        await storage.sync();

        return storage;
    }
}
