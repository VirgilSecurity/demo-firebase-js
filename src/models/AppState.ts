import EventEmitter from "wolfy87-eventemitter";
import { IChatPageState } from "../components/ChatWindow";

export default class AppState extends EventEmitter {

    store: IChatPageState = {
        error: null,
        username: null,
        hasPrivateKey: false,
        currentChannel: null,
        channels: [],
        messages: [],
    }

    setState(state: Partial<IChatPageState>) {
        const newState = Object.assign(this.store, state);
        this.emit('change', newState);
    }
}