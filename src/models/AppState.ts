import { IChannel } from './ChannelModel';
import { IMessage } from './MessageListModel';
import { Routes } from '../services/Routes';
import ChatModel from './ChatModel';

export interface IAppStore {
    chatModel: null | ChatModel;
    error: null | Error | string;
    username: string | null;
    channels: IChannel[];
    messages: IMessage[];
    currentChannel: IChannel | null;
}

export default class AppStore {
    defaultState: IAppStore = {
        error: null,
        username: null,
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
