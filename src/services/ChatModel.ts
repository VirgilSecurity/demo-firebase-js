import AppState from './AppState';
import firebase from 'firebase';
import ChannelListModel from './ChannelListModel';
import { IChannel } from './ChannelModel';

export class ChatModel {
    state = new AppState();
    channelsList = new ChannelListModel(this.username);

    channelsListener?: firebase.Unsubscribe;
    messageListener?: firebase.Unsubscribe;

    constructor(public username: string, public token: string) {
        this.listenChannels(username);
        this.state.setState({ username });
    }

    sendMessage = async (message: string) => {
        if (!this.state.store.currentChannel) throw Error('set channel first');
        const currentChannel = this.channelsList.getChannel(this.state.store.currentChannel.id);
        currentChannel.sendMessage(message);
    };

    listenMessages = async (channel: IChannel) => {
        const channelModel = this.channelsList.getChannel(channel.id);
        const messages = await channelModel.loadMessages();
        console.log('listenMessages', messages);
        this.state.setState({ currentChannel: channel, messages });
    };

    unsubscribe() {
        if (this.channelsListener) this.channelsListener();
        if (this.messageListener) this.messageListener();
        this.state.removeAllListeners();
    }

    private async listenChannels(username: string) {
        if (this.channelsListener) this.channelsListener();
        this.channelsListener = this.channelsList.listenUpdates(username, (channels) => {
            this.state.setState({ channels });
        });
    }

}

export default ChatModel;
