import VirgilApi from './VirgilApi';
import AppState from './AppState';
import firebase from 'firebase';
import ChannelListModel, { IChannel } from './ChannelListModel';
import MessageApi from './MessagesApi';

export class ChatModel {
    state = new AppState();
    channelsList = new ChannelListModel();
    VirgilApi = new VirgilApi(this.username, this.token);
    
    channelsListener?: firebase.Unsubscribe;
    messageListener?: firebase.Unsubscribe;

    constructor(public username: string, public token: string) {
        this.loadChannels(username);
    }

    syncMessages = async (channel: IChannel) => {
        this.state.setState({ messages: [] });
        if (this.messageListener) this.messageListener();
        this.messageListener = MessageApi.listenUpdates(channel, (error, updatedMessages) =>
            this.state.setState({ messages: updatedMessages, error }),
        );
        await this.loadMessages(channel);    
    };

    sendMessage = async (message: string) => {
        if (!this.state.state.currentChannel) throw Error('set channel first');

        const encryptedMessage = await this.VirgilApi!.encrypt(
            message,
            this.username,
            this.channelsList.getReceiverUsername(this.username, this.state.state.currentChannel),
        );

        MessageApi.sendMessage(this.state.state.currentChannel, encryptedMessage, this.username);
    };

    unsubscribe() {
        if (this.channelsListener) this.channelsListener();
        if (this.messageListener) this.messageListener();
        this.state.removeAllListeners();
    }

    private async loadChannels(username: string) {
        if (this.channelsListener) this.channelsListener();
        this.channelsListener = this.channelsList.listenUpdates(username, (error, channels) => {
            this.state.setState({ channels, error });
        });
        const channels = await this.channelsList.getChannels(username);
        this.state.setState({ channels });
    }

    private loadMessages = async (channel: IChannel) => {
        const encryptedMessages = await MessageApi.loadMessages(channel);
        const decryptedBodies = await Promise.all(encryptedMessages.map(m => this.VirgilApi!.decrypt(m.body)));
        encryptedMessages.forEach((m, i) => { m.body = decryptedBodies[i] });
        this.state.setState({ messages: encryptedMessages, currentChannel: channel });
    }
}

export default ChatModel;
