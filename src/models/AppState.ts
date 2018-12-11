import ChannelModel, { IChannel } from './ChannelModel';
import { IMessage } from './MessageListModel';
import ChatModel from './ChatModel';

export interface IAppStore {
    chatModel: null | ChatModel;
    error: null | Error | string;
    email: string | null;
    channels: ChannelModel[];
    messages: IMessage[];
    currentChannel: IChannel | null;
}

export default class AppStore {
    defaultState: IAppStore = {
        error: null,
        email: null,
        currentChannel: null,
        channels: [],
        messages: [],
        chatModel: null,
    };

    get state() {
        return this.stateLink();
    }

    // tslint:disable-next-line:no-any
    constructor(public setState: any, private stateLink: () => IAppStore) {

    }
}
