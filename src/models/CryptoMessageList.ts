import MessagesListModel, { IMessage } from './MessageListModel';
import { EThree } from '@virgilsecurity/e3kit';
import { VirgilPublicKey } from 'virgil-crypto';

export default class EncryptedMessageList {
    receiverPublicKey: Promise<VirgilPublicKey>;
    senderPublicKey: Promise<VirgilPublicKey>;

    constructor(readonly messageList: MessagesListModel, readonly virgilE2ee: EThree) {
        this.receiverPublicKey = virgilE2ee.lookupPublicKeys(this.messageList.channel.receiver.uid);
        this.senderPublicKey = virgilE2ee.lookupPublicKeys(this.messageList.channel.sender.uid);
    }

    async sendMessage(message: string) {
        const encryptedMessage = await this.virgilE2ee.encrypt(message, await this.receiverPublicKey);

        this.messageList.sendMessage(encryptedMessage);
    }

    listenUpdates(id: string, cb: (messages: IMessage[]) => void) {
        return this.messageList.listenUpdates(id, async messages => {
            const newMessages = messages.filter(m => m.body !== '');
            const promises = newMessages.map(async message => {
                // message sender differs from channel sender
                // cause in channel context current user is always sender
                const publicKey = message.sender === this.messageList.channel.sender.username
                    ? this.senderPublicKey
                    : this.receiverPublicKey;

                return this.virgilE2ee.decrypt(message.body, await publicKey);
            });
            const decryptedBodies = await Promise.all(promises);
            newMessages.forEach((m, i) => {
                m.body = decryptedBodies[i];
            });
            cb(messages);
        });
    }
}
