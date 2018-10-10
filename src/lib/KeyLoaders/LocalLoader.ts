import KeyLoader from './KeyLoader';
import VirgilToolbox from '../VirgilToolbox';
import { VirgilPrivateKey } from 'virgil-crypto';

export default class LocalLoader extends KeyLoader {
    constructor(public sdk: VirgilToolbox) {
        super(sdk);
    }

    async loadPrivateKey(): Promise<VirgilPrivateKey | null> {
        const privateKeyData = await this.sdk.keyStorage.load(this.sdk.identity);
        if (!privateKeyData) return null;
        return privateKeyData.privateKey as VirgilPrivateKey;
    }

    savePrivateKey(privateKey: VirgilPrivateKey) {
        this.sdk.keyStorage.store(this.sdk.identity, privateKey);
    }
}