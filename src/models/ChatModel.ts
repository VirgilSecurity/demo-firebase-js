import AppState from './AppState';
import firebase from 'firebase';
import ChannelListModel from './ChannelListModel';
import { IChannel } from './ChannelModel';
import VirgilApi from '../services/VirgilApi';

export class ChatModel {
    state = new AppState();
    channelsList = new ChannelListModel(this.username, this.virgilApi);

    channelsListener?: firebase.Unsubscribe;
    messageListener?: firebase.Unsubscribe;

    constructor(public username: string, public virgilApi: VirgilApi) {
        this.listenChannels(username);
        this.state.setState({ username });
        this.virgilApi.privateKey
            .then(_privateKey => {
                this.state.setState({ hasPrivateKey: true });
            })
            .catch(error => {
                if (!error) error = 'Unknown error.';
                if (error) error = error.message + '\nPlease try to reload page. If problem not solved, please contact support'; 
                this.state.setState({ error });
            });
    }

    sendMessage = async (message: string) => {
        if (!this.state.store.currentChannel) throw Error('set channel first');
        const currentChannel = this.channelsList.getChannel(this.state.store.currentChannel.id);
        try {
            await currentChannel.sendMessage(message);
        } catch (error) {
            this.state.setState({ error });
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
