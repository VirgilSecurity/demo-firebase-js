import MessagesListModel from './MessageListModel';
import AppState from './AppState';

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

    subscribeOnMessages() {
        this.loadMessages();
        return this.messageList.listenUpdates(this.id, (error, updatedMessages) =>{});
    }

    loadMessages() {
        return this.messageList.loadMessages(this);
    }
}
