import EventEmitter from "wolfy87-eventemitter";
import { IChatPageState } from "../ChatPage";

export default class AppState extends EventEmitter {
    state: IChatPageState = {
        error: null,
        username: null,
        currentChannel: null,
        channels: [],
        messages: [],
    }

    setState(state: Partial<IChatPageState>) {
        const newState = Object.assign(this.state, state);
        this.emit('change', newState);
    }
}