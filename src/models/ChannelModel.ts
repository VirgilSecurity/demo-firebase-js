import MessagesListModel, { IMessage } from './MessageListModel';
import MessageStorage from './MessageStorage';
import CryptoMessageList from './CryptoMessageList';
import VirgilE2ee from '../lib/VirgilE2ee';

export interface IChannel {
    id: string;
    count: number;
    members: string[];
}

export default class ChannelModel implements IChannel {
    public id: string;
    public count: number;
    public members: string[];
    private messageStorage: MessageStorage;
    private encryptedMessageList: CryptoMessageList;

    constructor(
        { id, count, members }: IChannel,
        public sender: string,
        public virgilE2ee: VirgilE2ee,
    ) {
        this.id = id;
        this.count = count;
        this.members = members;
        this.messageStorage = new MessageStorage(this.id);

        const messageList = new MessagesListModel(this, this.sender);

        this.encryptedMessageList = new CryptoMessageList(messageList, virgilE2ee);
    }

    get receiver() {
        return this.members.filter(e => e !== this.sender)[0];
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
