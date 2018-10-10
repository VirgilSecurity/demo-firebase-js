import EventEmitter from "wolfy87-eventemitter";
import { IChannel } from "./ChannelModel";
import { IMessage } from "./MessageListModel";

export interface IAppState {
    error: null | Error | string;
    username: string | null;
    channels: IChannel[];
    messages: IMessage[];
    currentChannel: IChannel | null;
}

export default class AppState extends EventEmitter {

    store: IAppState = {
        error: null,
        username: null,
        currentChannel: null,
        channels: [],
        messages: [],
    }

    setState(state: Partial<IAppState>) {
        const newState = Object.assign(this.store, state);
        this.emit('change', newState);
    }
}