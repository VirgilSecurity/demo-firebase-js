import MessagesListModel, { IMessage } from './MessageListModel';
import { EThree, ICard } from '@virgilsecurity/e3kit-browser';

export default class EncryptedMessageList {
    receiverCard: Promise<ICard>;
    senderCard: Promise<ICard>;

    constructor(readonly messageList: MessagesListModel, readonly virgilE2ee: EThree) {
        this.receiverCard = virgilE2ee.findUsers(this.messageList.channel.receiver.uid);
        this.senderCard = virgilE2ee.findUsers(this.messageList.channel.sender.uid);
    }

    async sendMessage(message: string) {
        const encryptedMessage = await this.virgilE2ee.authEncrypt(message, await this.receiverCard);

        this.messageList.sendMessage(encryptedMessage);
    }

    listenUpdates(id: string, cb: (messages: IMessage[]) => void) {
        return this.messageList.listenUpdates(id, async messages => {
            const newMessages = messages.filter(m => m.body !== '');
            const promises = newMessages.map(async message => {
                // message sender differs from channel sender
                // cause in channel context current user is always sender
                const publicKey = message.sender === this.messageList.channel.sender.username
                    ? this.senderCard
                    : this.receiverCard;

                return this.virgilE2ee.authDecrypt(message.body, await publicKey);
            });
            const decryptedBodies = await Promise.all(promises);
            newMessages.forEach((m, i) => {
                m.body = decryptedBodies[i];
            });
            cb(messages);
        });
    }
}
