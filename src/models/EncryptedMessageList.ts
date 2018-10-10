import VirgilApi from '../services/VirgilApi';
import MessagesListModel, { IMessage } from './MessageListModel';
import { VirgilPublicKey } from 'virgil-crypto';

export default class EncryptedMessageList {
    receiverPublicKeys: Promise<VirgilPublicKey[]>;

    constructor(readonly messageList: MessagesListModel, readonly virgilApi: VirgilApi) {
        this.receiverPublicKeys = this.getReceiverPublicKeys();
    }

    async sendMessage(message: string) {
        const receiverPublicKeys = await this.receiverPublicKeys;
        if (!receiverPublicKeys.length) {
            throw new Error(
                'Receiver public keys not found. Please login again with your receiver.',
            );
        }

        const encryptedMessage = await this.virgilApi.encrypt(message, receiverPublicKeys);

        this.messageList.sendMessage(encryptedMessage);
    }

    listenUpdates(id: string, cb: (messages: IMessage[]) => void) {
        return this.messageList.listenUpdates(id, async messages => {
            const promises = messages.map(m => this.virgilApi.decrypt(m.body));

            const decryptedBodies = await Promise.all(promises);
            messages.forEach((m, i) => (m.body = decryptedBodies[i]));
            cb(messages);
        });
    }

    private getReceiverPublicKeys() {
        return this.virgilApi.getPublicKeys(this.messageList.channel.receiver);
    }
}
