import MessagesListModel from './MessageListModel';

export interface IChannel {
    id: string;
    count: number;
    members: string[];
}

export default class ChannelModel implements IChannel {
    public id: string;
    public count: number;
    public members: string[];
    public messageList: MessagesListModel;

    constructor(
        { id, count, members }: IChannel,
        public sender: string
    ) {
        this.id = id;
        this.count = count;
        this.members = members;
        this.messageList = new MessagesListModel(this, this.sender);
    }

    get receiver() {
        return this.members.filter(e => e !== this.sender)[0];
    }

    sendMessage(message: string) {
        this.messageList.sendMessage(message);
    }

    // listenMessages(cb: (messages: IMessage[]) => void) {
    //     return this.messageList.listenUpdates(this.id, cb);
    // }

    loadMessages() {
        return this.messageList.loadMessages();
    }
}
