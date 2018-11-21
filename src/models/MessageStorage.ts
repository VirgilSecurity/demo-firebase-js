import { differenceBy } from 'lodash';
import { IMessage } from './MessageListModel';

const messageStorageName = 'virgil_firebase_messages';

export default class MessageStorage {
    messages: IMessage[] = [];

    get lastMessageDate() {
        if (this.messages.length) {
            return this.messages[this.messages.length - 1].createdAt;
        }
        return new Date(0);
    }

    constructor(private channelId: string) {
        this.restoreMessages();
    }

    addMessages(messages: IMessage[]): IMessage[] {
        const newMessages = differenceBy(messages, this.messages, e => e.id);
        this.messages = this.messages
            .concat(newMessages)
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        const storageString = window.localStorage.getItem(messageStorageName);

        let storage: { [s: string]: IMessage[] } = {};

        if (storageString) {
            try {
                storage = JSON.parse(storageString);
            } catch (e) {}
        }

        storage[this.channelId] = this.messages;

        window.localStorage.setItem(messageStorageName, JSON.stringify(storage));

        return this.messages;
    }

    private restoreMessages() {
        let messages: IMessage[] = [];
        const savedMessages = window.localStorage.getItem(messageStorageName);
        let parsedStore: { [s: string]: IMessage[] } = {};
        if (savedMessages) parsedStore = JSON.parse(savedMessages);
        const hasMessages = parsedStore[this.channelId] && Array.isArray(parsedStore[this.channelId]);
        messages = hasMessages ? parsedStore[this.channelId] : [];
        messages.forEach(m => (m.createdAt = new Date(m.createdAt)));
        this.messages = messages;
    }
}
