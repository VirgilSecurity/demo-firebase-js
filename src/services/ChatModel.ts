import VirgilApi from './VirgilApi';
import AppState from './AppState';
import firebase from 'firebase';
import ChannelListModel from './ChannelListModel';
import { IChannel } from './ChannelModel';

export class ChatModel {
    state = new AppState();
    channelsList = new ChannelListModel(this.username);
    VirgilApi = new VirgilApi(this.username, this.token);
    
    channelsListener?: firebase.Unsubscribe;
    messageListener?: firebase.Unsubscribe;

    constructor(public username: string, public token: string) {
        this.listenChannels(username);
        this.state.setState({ username });
    }

    sendMessage = async (message: string) => {
        const currentChannel = this.channelsList.getChannel(this.state.store.currentChannel);
        if (!currentChannel) throw Error('set channel first');

        const encryptedMessage = await this.VirgilApi!.encrypt(
            message,
            this.username,
            currentChannel.receiver,
        );

        currentChannel.sendMessage(encryptedMessage);
    };

    listenMessages = async (channel: IChannel) => {
        const channelModel = this.channelsList.getChannel(channel.id);
        const encryptedMessages = await channelModel.loadMessages();
        const decryptedBodies = await Promise.all(encryptedMessages.map(m => this.VirgilApi!.decrypt(m.body)));
        encryptedMessages.forEach((m, i) => { m.body = decryptedBodies[i] });
        this.state.setState({ messages: encryptedMessages, currentChannel: channel.id });
    }

    unsubscribe() {
        if (this.channelsListener) this.channelsListener();
        if (this.messageListener) this.messageListener();
        this.state.removeAllListeners();
    }

    private async listenChannels(username: string) {
        if (this.channelsListener) this.channelsListener();
        this.channelsListener = this.channelsList.listenUpdates(username, (error, channels) => {
            this.state.setState({ channels, error });
        });
        const channels = await this.channelsList.loadChannels(username);
        this.state.setState({ channels });
    }
}

export default ChatModel;
