import { VirgilPythiaCrypto, VirgilCrypto, VirgilCardCrypto, VirgilPublicKey } from 'virgil-crypto/dist/virgil-crypto-pythia.es';
import { VirgilCardVerifier, CachingJwtProvider, CardManager, KeyStorage } from 'virgil-sdk';
import { createBrainKey, BrainKey } from 'virgil-pythia';

export default class VirgilApi {
    static jwtEndpoint = 'https://us-central1-js-chat-ff5ca.cloudfunctions.net/api/generate_jwt';

    identity: string;
    keyStorage = new KeyStorage();
    private virgilCrypto = new VirgilCrypto();
    private cardCrypto = new VirgilCardCrypto(this.virgilCrypto);
    private cardVerifier = new VirgilCardVerifier(this.cardCrypto, { verifySelfSignature: false, verifyVirgilSignature: false });
    private cardManager: CardManager;
    private virgilPythiaCrypto = new VirgilPythiaCrypto();
    private brainKey: BrainKey;

    constructor(identity: string, token: string) {
        this.identity = identity;

        const getJwt = () =>
            fetch(VirgilApi.jwtEndpoint, {
                headers: new Headers({
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                }),
                method: 'POST',
                body: JSON.stringify({ identity }),
            }).then(res => res.json().then(d => d.token));

        const jwtProvider = new CachingJwtProvider(getJwt);

        this.cardManager = new CardManager({
            cardCrypto: this.cardCrypto,
            cardVerifier: this.cardVerifier,
            accessTokenProvider: jwtProvider,
            retryOnUnauthorized: true
        });

        this.brainKey = createBrainKey({
            virgilCrypto: this.virgilCrypto,
            virgilPythiaCrypto: this.virgilPythiaCrypto,
            accessTokenProvider: jwtProvider
        });
    }

    async createCard(password: string) {
        if (await this.keyStorage.exists(this.identity)) return;
        const keyPair = await this.brainKey.generateKeyPair(password);

        this.keyStorage.save(this.identity, this.virgilCrypto.exportPrivateKey(keyPair.privateKey));

        const card = await this.cardManager.publishCard({
            privateKey: keyPair.privateKey,
            publicKey: keyPair.publicKey,
        });

        return { card, keyPair };
    }

    async isCardCreated() {
        const cards = await this.cardManager.searchCards(this.identity);
        return Boolean(cards.length);
    }

    async encrypt(message: string, senderIdentity: string, recipientIdentity: string) {
        const [senderCards, recipientCards] = await Promise.all([
            this.cardManager.searchCards(senderIdentity),
            this.cardManager.searchCards(recipientIdentity),
        ]);

        const cards = [...senderCards, ...recipientCards];

        if (recipientCards.length > 0) {
            const publicKeys = cards.map(card => card.publicKey);

            const encryptedData = this.virgilCrypto.encrypt(
                message,
                publicKeys as VirgilPublicKey[],
            );

            return encryptedData.toString('base64');
        }

        throw new Error('Recipient cards not found');
    }

    async signThenEncrypt(message: string, recipientIdentity: string) {
        const recipientCards = await this.cardManager.searchCards(recipientIdentity);
        const senderPrivateKeyBytes = await this.keyStorage.load(this.identity);
        if (!senderPrivateKeyBytes) throw new Error('sender private key not found');
        const senderPrivateKey = this.virgilCrypto.importPrivateKey(senderPrivateKeyBytes);

        if (recipientCards.length > 0) {
            const recipientPublicKeys = recipientCards.map(card => card.publicKey);
            const encryptedData = this.virgilCrypto.signThenEncrypt(
                message,
                senderPrivateKey,
                recipientPublicKeys as VirgilPublicKey[],
            );

            return encryptedData.toString('base64');
        }

        throw new Error('Recipient cards not found');
    }

    async decrypt(message: string) {
        const privateKeyData = await this.keyStorage.load(this.identity);
        if (!privateKeyData) throw new Error('sender private key not found');
        const privateKey = this.virgilCrypto.importPrivateKey(privateKeyData);

        const decryptedData = this.virgilCrypto.decrypt(message, privateKey);

        return decryptedData.toString('utf8');
    }

    async decryptThenVerify(message: string, senderIdentity: string) {
        const senderCards = await this.cardManager.searchCards(senderIdentity);
        const privateKeyData = await this.keyStorage.load(this.identity);
        if (!privateKeyData) throw new Error('sender private key not found');
        const privateKey = this.virgilCrypto.importPrivateKey(privateKeyData);

        if (senderCards.length > 0) {
            const senderPublicKeys = senderCards.map(card => card.publicKey);
            const decryptedData = this.virgilCrypto.decryptThenVerify(
                message,
                privateKey,
                senderPublicKeys as VirgilPublicKey[],
            );
            return decryptedData.toString('utf8');
        }

        throw new Error('Sender cards not found');
    }
}
