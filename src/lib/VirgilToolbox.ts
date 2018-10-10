import { VirgilCrypto, VirgilCardCrypto } from 'virgil-crypto/dist/virgil-crypto-pythia.es';
import { VirgilPublicKey, VirgilPrivateKeyExporter } from 'virgil-crypto';
import {
    VirgilCardVerifier,
    CachingJwtProvider,
    CardManager,
    PrivateKeyStorage,
    KeyEntryStorage,
} from 'virgil-sdk';

export default class VirgilToolbox {
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
