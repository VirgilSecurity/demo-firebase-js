import MessagesListModel from './MessageListModel';
import { IMessage } from '../components/Messages';

export interface IChannel {
    id: string;
    count: number;
    members: string[];
}

export default class ChannelModel implements IChannel {
    id: string;
    count: number;
    members: string[];
    messageList = new MessagesListModel(this, this.sender);

    constructor(
        { id, count, members }: IChannel,
        public sender: string
    ) {
        this.id = id;
        this.count = count;
        this.members = members;
    }

    get receiver() {
        return this.members.filter(e => e !== this.sender)[0];
    }

    sendMessage(message: string) {
        this.messageList.sendMessage(message);
    }

    listenMessages(cb: (messages: IMessage[]) => void) {
        return this.messageList.listenUpdates(this.id, cb);
    }

    loadMessages() {
        return this.messageList.loadMessages(this);
    }
}
