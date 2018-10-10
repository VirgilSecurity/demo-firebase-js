import AppState from './AppState';
import firebase from 'firebase';
import ChannelListModel from './ChannelListModel';
import { IChannel } from './ChannelModel';
import VirgilE2ee from '../lib/VirgilE2ee';

export class ChatModel {
    state = new AppState();
    channelsList = new ChannelListModel(this.virgilE2ee);

    channelsListener?: firebase.Unsubscribe;
    messageListener?: firebase.Unsubscribe;

    constructor(public virgilE2ee: VirgilE2ee) {
        this.listenChannels(this.virgilE2ee.identity);
        this.state.setState({ username: this.virgilE2ee.identity });
    }

    sendMessage = async (message: string) => {
        if (!this.state.store.currentChannel) throw Error('set channel first');
        const currentChannel = this.channelsList.getChannel(this.state.store.currentChannel.id);
        try {
            await currentChannel.sendMessage(message);
        } catch (error) {
            this.state.setState({ error });
            throw error;
        }
    };

    listenMessages = async (channel: IChannel) => {
        if (this.messageListener) this.messageListener();
        const channelModel = this.channelsList.getChannel(channel.id);
        this.state.setState({ currentChannel: channel, messages: [] });
        this.messageListener = channelModel.listenMessages(messages =>
            this.state.setState({ messages }),
        );
    };

    unsubscribe() {
        if (this.channelsListener) this.channelsListener();
        if (this.messageListener) this.messageListener();
        this.state.removeAllListeners();
    }

    private async listenChannels(username: string) {
        if (this.channelsListener) this.channelsListener();
        this.channelsListener = this.channelsList.listenUpdates(username, channels =>
            this.state.setState({ channels }),
        );
    }
}

export default ChatModel;
