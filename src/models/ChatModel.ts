import AppState from './AppState';
import firebase from 'firebase';
import ChannelListModel from './ChannelListModel';
import { IChannel } from './ChannelModel';
import Facade from '../services/VirgilApi';

export class ChatModel {
    state = new AppState();
    channelsList = new ChannelListModel(this.facade);

    channelsListener?: firebase.Unsubscribe;
    messageListener?: firebase.Unsubscribe;

    constructor(public facade: Facade) {
        this.listenChannels(this.facade.identity);
        this.state.setState({ username: this.facade.identity });
        this.facade.encryptionClient
            .then(() => this.state.setState({ hasPrivateKey: true }))
            .catch(error => {
                const errorMessage = `Failed to load user private key:
${error ? error.message : 'Unknown error'}
Please try to reload page. If problem not solved, please contact support
`;
                this.state.setState({ error: errorMessage });
            });
    }

    sendMessage = async (message: string) => {
        if (!this.state.store.currentChannel) throw Error('set channel first');
        const currentChannel = this.channelsList.getChannel(this.state.store.currentChannel.id);
        try {
            await currentChannel.sendMessage(message);
        } catch (error) {
            this.state.setState({ error });
            console.error(error);
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
