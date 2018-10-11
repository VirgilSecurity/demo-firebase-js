import MessagesListModel, { IMessage } from './MessageListModel';
import VirgilE2ee from '../lib/VirgilE2ee';

export default class EncryptedMessageList {

    constructor(readonly messageList: MessagesListModel, readonly virgilE2ee: VirgilE2ee) {
        virgilE2ee.getReceiver(this.messageList.channel.receiver).preloadKeys();
    }

    async sendMessage(message: string) {
        const encryptedMessage = await this.virgilE2ee.encrypt(message, this.messageList.channel.receiver);

        this.messageList.sendMessage(encryptedMessage);
    }

    listenUpdates(id: string, cb: (messages: IMessage[]) => void) {
        return this.messageList.listenUpdates(id, async messages => {
            const newMessages = messages.filter(m => m.body !== '');
            const promises = newMessages.map(m => this.virgilE2ee.decrypt(m.body));

            const decryptedBodies = await Promise.all(promises);
            newMessages.forEach((m, i) => { m.body = decryptedBodies[i] });
            cb(messages);
        });
    }
}
