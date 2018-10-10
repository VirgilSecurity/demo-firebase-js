import { createBrainKey } from 'virgil-pythia';
import {
    SyncKeyStorage,
    CloudKeyStorage,
    KeyknoxManager,
    KeyknoxCrypto,
} from '@virgilsecurity/keyknox';
import { VirgilPythiaCrypto, VirgilPublicKey } from 'virgil-crypto/dist/virgil-crypto-pythia.es';
import VirgilToolbox from '../VirgilToolbox';
import { VirgilPrivateKey } from 'virgil-crypto';
import { KeyEntryStorage } from 'virgil-sdk';
import KeyLoader from './KeyLoader';

export interface IBrainKey {
    generateKeyPair(
        password: string,
        id?: string,
    ): Promise<{
        privateKey: VirgilPrivateKey;
        publicKey: VirgilPublicKey;
    }>;
}

export default class KeyknoxLoader extends KeyLoader {
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
