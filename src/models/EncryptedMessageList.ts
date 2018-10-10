import VirgilApi from '../services/VirgilApi';
import MessagesListModel, { IMessage } from './MessageListModel';

export default class EncryptedMessageList {

    constructor(readonly messageList: MessagesListModel, readonly virgilApi: VirgilApi) {
        virgilApi.getReceiver(this.messageList.channel.receiver).preloadKeys();
    }

    async sendMessage(message: string) {
        const encryptedMessage = await this.virgilApi.encrypt(message, this.messageList.channel.receiver);

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
}
