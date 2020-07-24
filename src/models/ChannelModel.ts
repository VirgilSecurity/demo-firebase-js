import MessagesListModel, { IMessage } from './MessageListModel';
import MessageStorage from './MessageStorage';
import CryptoMessageList from './CryptoMessageList';
import { EThree } from '@virgilsecurity/e3kit-browser';

export interface IChannel {
    id: string;
    count: number;
    members: ChannelUser[];
}

export type ChannelUser = { username: string, uid: string };

export default class ChannelModel implements IChannel {
    public id: string;
    public count: number;
    public members: ChannelUser[];
    // public receiver: ChannelUser;
    private messageStorage: MessageStorage;
    private encryptedMessageList: CryptoMessageList;

    constructor(
        { id, count, members }: IChannel,
        public senderUsername: string,
        public virgilE2ee: EThree,
    ) {
        this.id = id;
        this.count = count;
        this.members = members;
        this.messageStorage = new MessageStorage(this.id);

        const messageList = new MessagesListModel(this);

        this.encryptedMessageList = new CryptoMessageList(messageList, virgilE2ee);
    }

    get receiver() {
        return this.members.filter(e => e.username !== this.senderUsername)[0];
    }
    
    get sender() {
        return this.members.filter(e => e.username === this.senderUsername)[0];
    }

    async sendMessage(message: string) {
        try {
            return this.encryptedMessageList.sendMessage(message);
        } catch (e) {
            throw e;
        }
    }

    listenMessages(cb: (messages: IMessage[]) => void) {
        return this.encryptedMessageList.listenUpdates(this.id, messages => {
            const allMessages = this.messageStorage.addMessages(messages);
            cb(allMessages); 
        });
    }
}
