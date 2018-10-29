import MessagesListModel, { IMessage } from './MessageListModel';
import { EThree } from '@virgilsecurity/e3kit';
import { VirgilPublicKey } from 'virgil-crypto';

export default class EncryptedMessageList {
    receiverPublicKeys: Promise<VirgilPublicKey[]>;
    
    constructor(readonly messageList: MessagesListModel, readonly virgilE2ee: EThree) {
        this.receiverPublicKeys = virgilE2ee.lookupPublicKeys([this.messageList.channel.receiver]);
    }

    async sendMessage(message: string) {
        const encryptedMessage = await this.virgilE2ee.encrypt(message, await this.receiverPublicKeys) as string;

        this.messageList.sendMessage(encryptedMessage);
    }

    listenUpdates(id: string, cb: (messages: IMessage[]) => void) {
        return this.messageList.listenUpdates(id, async messages => {
            const newMessages = messages.filter(m => m.body !== '');
            const publicKeys = await this.receiverPublicKeys;
            const promises = newMessages.map(m => this.virgilE2ee.decrypt(m.body, publicKeys) as Promise<string>);
            const decryptedBodies = await Promise.all(promises);
            newMessages.forEach((m, i) => { m.body = decryptedBodies[i] });
            cb(messages);
        });
    }
}
