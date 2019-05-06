import ChannelModel from './ChannelModel';
import { IMessage } from './MessageListModel';
import ChatModel from './ChatModel';

export interface IAppStore {
    chatModel: null | ChatModel;
    error: null | Error | string;
    channels: ChannelModel[];
    messages: IMessage[];
    currentChannel: ChannelModel | null;
}

export default class AppStore {
    defaultState: IAppStore = {
        error: null,
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
