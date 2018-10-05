import MessagesListModel from './MessageListModel';
import { IMessage } from '../components/Messages';
import Facade from '../services/VirgilApi';

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
        public sender: string,
        public facade: Facade,
    ) {
        this.id = id;
        this.count = count;
        this.members = members;
        this.messageList = new MessagesListModel(this, this.sender, this.facade);
    }

    get receiver() {
        return this.members.filter(e => e !== this.sender)[0];
    }

    async sendMessage(message: string) {
        try {
            return this.messageList.sendMessage(message);
        } catch(e) {
            throw e;
        }
    }

    listenMessages(cb: (messages: IMessage[]) => void) {
        return this.messageList.listenUpdates(this.id, cb);
    }
}
