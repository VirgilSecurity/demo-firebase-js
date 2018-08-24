import {
    VirgilCrypto,
    VirgilCardCrypto,
    VirgilPublicKey,
    VirgilPrivateKeyExporter,
    VirgilPrivateKey,
} from 'virgil-crypto';
import { VirgilCardVerifier, CachingJwtProvider, CardManager, PrivateKeyStorage } from 'virgil-sdk';

export default class VirgilApi {
    static jwtEndpoint = 'https://YOUR_ENDPOINT.cloudfunctions.net/api/generate_jwt';

    identity: string;
    privateKey: Promise<VirgilPrivateKey>;
    publicKeys: Promise<VirgilPublicKey[]>;
    private virgilCrypto = new VirgilCrypto();
    keyStorage = new PrivateKeyStorage(new VirgilPrivateKeyExporter(this.virgilCrypto));
    private cardCrypto = new VirgilCardCrypto(this.virgilCrypto);
    private cardVerifier = new VirgilCardVerifier(this.cardCrypto);
    private cardManager: CardManager;

    constructor(identity: string, public getToken: () => Promise<string>) {
        this.identity = identity;
        
        const getJwt = this.getJwt(identity);
        const jwtProvider = new CachingJwtProvider(getJwt);

        this.cardManager = new CardManager({
            cardCrypto: this.cardCrypto,
            cardVerifier: this.cardVerifier,
            accessTokenProvider: jwtProvider,
            retryOnUnauthorized: true,
        });

        this.publicKeys = this.getPublicKeys(this.identity);
        this.privateKey = this.obtainPrivateKey();
    }

    async createCard() {
        const keyPair = this.virgilCrypto.generateKeys();

        this.keyStorage.store(this.identity, keyPair.privateKey);

        const card = await this.cardManager.publishCard({
            privateKey: keyPair.privateKey,
            publicKey: keyPair.publicKey,
        });

        this.publicKeys = this.publicKeys.then(keys => keys.concat(keyPair.publicKey));

        return { card, keyPair };
    }

    async encrypt(message: string, publicKeys: VirgilPublicKey[]) {
        const encryptedData = this.virgilCrypto.encrypt(
            message,
            // encrypted public keys of sender are added to add possibility to decrypt
            // message from other device
            [...publicKeys, ...(await this.publicKeys)] as VirgilPublicKey[],
        );

        return encryptedData.toString('base64');
    }

    async decrypt(message: string) {
        const decryptedData = this.virgilCrypto.decrypt(message, await this.privateKey);
        return decryptedData.toString('utf8');
    }

    getPublicKeys = async (identity: string) => {
        const cards = await this.cardManager.searchCards(identity);
        const publicKeys = cards.map(card => card.publicKey as VirgilPublicKey);
        return publicKeys;
    };

    private async obtainPrivateKey() {
        const privateKeyData = await this.keyStorage.load(this.identity);
        if (!privateKeyData) {
            // In this demo we will create new card if user signIns from other device, but it is
            // not optimal solution.
            const { keyPair } = await this.createCard();
            this.publicKeys.then(keys => keys.concat(keyPair.publicKey));
            return keyPair.privateKey;
        }
        return privateKeyData.privateKey as VirgilPrivateKey;
    };

    private getJwt = (identity: string) => async () => {
        const token = await this.getToken();
        const response = await fetch(VirgilApi.jwtEndpoint, {
                headers: new Headers({
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            }),
            method: 'POST',
            body: JSON.stringify({ identity }),
        })
        if (response.ok) {
            const data: { token: string } = await response.json();
            return data.token;
        }
        throw new Error('Error in getJWT with code: ' + response.status);
    }
}
