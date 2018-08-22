import {
    VirgilCrypto,
    VirgilCardCrypto,
    VirgilPublicKey,
    VirgilPrivateKeyExporter,
    VirgilPrivateKey,
} from 'virgil-crypto';
import { VirgilCardVerifier, CachingJwtProvider, CardManager, PrivateKeyStorage } from 'virgil-sdk';

export default class VirgilApi {
    static jwtEndpoint = 'https://YOUR_FUNCTION_URL.cloudfunctions.net/api/generate_jwt';

    identity: string;
    privateKey: Promise<VirgilPrivateKey>;
    publicKeys: Promise<VirgilPublicKey[]>
    private virgilCrypto = new VirgilCrypto();
    keyStorage = new PrivateKeyStorage(new VirgilPrivateKeyExporter(this.virgilCrypto));
    private cardCrypto = new VirgilCardCrypto(this.virgilCrypto);
    private cardVerifier = new VirgilCardVerifier(this.cardCrypto, {
        verifySelfSignature: false,
        verifyVirgilSignature: false,
    });
    private cardManager: CardManager;

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
            retryOnUnauthorized: true,
        });

        this.publicKeys = this.getPublicKeys(this.identity);
        this.privateKey = this.obtainPrivateKey();
    }

    async createCard() {
        const keyPair = await this.virgilCrypto.generateKeys();

        this.keyStorage.store(
            this.identity,
            keyPair.privateKey,
        );

        const card = await this.cardManager.publishCard({
            privateKey: keyPair.privateKey,
            publicKey: keyPair.publicKey,
        });

        return { card, keyPair };
    }

    async encrypt(message: string, publicKeys: VirgilPublicKey[] ) {
        const encryptedData = this.virgilCrypto.encrypt(
            message,
            [...publicKeys, ...await this.publicKeys] as VirgilPublicKey[],
        );

        return encryptedData.toString('base64');
    }

    async signThenEncrypt(message: string, recipientIdentity: string) {
        const recipientCards = await this.cardManager.searchCards(recipientIdentity);

        if (recipientCards.length > 0) {
            const recipientPublicKeys = recipientCards.map(card => card.publicKey);
            const encryptedData = this.virgilCrypto.signThenEncrypt(
                message,
                await this.privateKey,
                recipientPublicKeys as VirgilPublicKey[],
            );

            return encryptedData.toString('base64');
        }

        throw new Error('Recipient cards not found');
    }

    async decrypt(message: string) {
        const decryptedData = this.virgilCrypto.decrypt(message, await this.privateKey);

        return decryptedData.toString('utf8');
    }

    async decryptThenVerify(message: string, senderIdentity: string) {
        const senderCards = await this.cardManager.searchCards(senderIdentity);

        if (senderCards.length > 0) {
            const senderPublicKeys = senderCards.map(card => card.publicKey);
            const decryptedData = this.virgilCrypto.decryptThenVerify(
                message,
                await this.privateKey,
                senderPublicKeys as VirgilPublicKey[],
            );
            return decryptedData.toString('utf8');
        }

        throw new Error('Sender cards not found');
    }

    private obtainPrivateKey = async () => {
        const privateKeyData = await this.keyStorage.load(this.identity);
        if (!privateKeyData) {
            // In this demo we will create new card if user signIns from other device, but it is 
            // not optimal solution. 
            const { keyPair } = await this.createCard();
            this.publicKeys.then(keys => keys.push(keyPair.publicKey));
            return keyPair.privateKey;
        }
        return privateKeyData.privateKey as VirgilPrivateKey;
    }

    getPublicKeys = async (identity: string) => {
        const cards = await this.cardManager.searchCards(identity);
        return cards.map(card => card.publicKey as VirgilPublicKey);
    }
}
