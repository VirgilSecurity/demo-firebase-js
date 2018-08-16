import { VirgilCrypto, VirgilCardCrypto, VirgilPublicKey } from 'virgil-crypto';
import { VirgilCardVerifier, CallbackJwtProvider, CardManager, KeyStorage } from 'virgil-sdk';

export default class VirgilApi {
    static jwtEndpoint = 'https://us-central1-js-chat-ff5ca.cloudfunctions.net/api/generate_jwt';

    identity: string;
    private virgilCrypto = new VirgilCrypto();
    private cardCrypto = new VirgilCardCrypto(this.virgilCrypto);
    private keyStorage = new KeyStorage();
    private cardVerifier = new VirgilCardVerifier(this.cardCrypto);
    private cardManager: CardManager;

    constructor(identity: string, token: string) {
        this.identity = identity;

        const getJwt = () => fetch(VirgilApi.jwtEndpoint, {
            headers: new Headers({ 
                'Content-Type' : 'application/json',
                'Authorization': `Bearer ${token}`
            }),
            method: 'POST',
            body: JSON.stringify({ identity })
        }).then(res => res.json().then(d => d.token));

        const jwtProvider = new CallbackJwtProvider(getJwt);

        this.cardManager = new CardManager({
            cardCrypto: this.cardCrypto,
            cardVerifier: this.cardVerifier,
            accessTokenProvider: jwtProvider,
            retryOnUnauthorized: true
        });
    }

    async createCard () {
        const keyPair = this.virgilCrypto.generateKeys();
        if (await this.keyStorage.exists(this.identity)) throw new Error('You already have private key');

        this.keyStorage.save(
            this.identity,
            this.virgilCrypto.exportPrivateKey(keyPair.privateKey)
        );

        const card = await this.cardManager.publishCard({
            privateKey: keyPair.privateKey,
            publicKey: keyPair.publicKey
        });

        return { card, keyPair };
    };

    async isCardCreated () {
        const cards = await this.cardManager.searchCards(this.identity);
        return Boolean(cards.length);
    }

    async encrypt (message: string, recipientIdentity: string) {
        const recipientCards = await this.cardManager.searchCards(recipientIdentity);

        if (recipientCards.length > 0) {
            const recipientPublicKeys = recipientCards.map(card => card.publicKey);
            const encryptedData = this.virgilCrypto.encrypt(
                message,
                recipientPublicKeys as VirgilPublicKey[]
            );

            return encryptedData.toString('base64');
        }

        throw new Error('Recipient cards not found');
    }

    async signThenEncrypt (message: string, recipientIdentity: string) {
        const recipientCards = await this.cardManager.searchCards(recipientIdentity);
        const senderPrivateKeyBytes = await this.keyStorage.load(this.identity);
        if (!senderPrivateKeyBytes) throw new Error('sender private key not found');
        const senderPrivateKey = this.virgilCrypto.importPrivateKey(senderPrivateKeyBytes);

        if (recipientCards.length > 0) {
            const recipientPublicKeys = recipientCards.map(card => card.publicKey);
            const encryptedData = this.virgilCrypto.signThenEncrypt(
                message,
                senderPrivateKey,
                recipientPublicKeys as VirgilPublicKey[]
            );

            return encryptedData.toString('base64');
        }

        throw new Error('Recipient cards not found');
    }

    async decrypt (message: string) {
        const privateKeyData = await this.keyStorage.load(this.identity);
        if (!privateKeyData) throw new Error('sender private key not found')
        const privateKey = this.virgilCrypto.importPrivateKey(privateKeyData);

        const decryptedData = this.virgilCrypto.decrypt(
            message,
            privateKey
        );

        return decryptedData.toString('utf8');
    }

    async decryptThenVerify (message: string, senderIdentity: string) {
        const senderCards = await this.cardManager.searchCards(senderIdentity);
        const privateKeyData = await this.keyStorage.load(this.identity);
        if (!privateKeyData) throw new Error('sender private key not found')
        const privateKey = this.virgilCrypto.importPrivateKey(privateKeyData);

        if (senderCards.length > 0) {
            const senderPublicKeys = senderCards.map(card => card.publicKey);
            const decryptedData = this.virgilCrypto.decryptThenVerify(
                message,
                privateKey,
                senderPublicKeys as VirgilPublicKey[]
            );
            return decryptedData.toString('utf8');
        }

        throw new Error('Sender cards not found');
    }
}