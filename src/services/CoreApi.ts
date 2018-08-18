import UserApi from './UserApi';
import VirgilApi from './VirgilApi';
import AppState from './AppState';
import firebase from 'firebase';
import ChannelsApi, { IChannel } from './ChannelsApi';
import MessageApi from './MessagesApi';

export class CoreApi {
    state = new AppState();
    VirgilApi?: VirgilApi;

    channelsListener?: firebase.Unsubscribe;
    messageListener?: firebase.Unsubscribe;

    constructor() {
        firebase.auth().onAuthStateChanged(this.handleAuthStateChange);
    }

    async signUp(username: string, password: string) {
        await UserApi.signUp(username, password);
    }

    async signIn(username: string, password: string) {
        await UserApi.signIn(username, password);
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
        if (!this.state.state.username) throw Error('no user');
        const encryptedMessage = await this.VirgilApi!.encrypt(
            message,
            this.state.state.username,
            ChannelsApi.getReceiverUsername(this.state.state.username, this.state.state.currentChannel),
        );
        console.log(message,
            this.state.state.username,
            ChannelsApi.getReceiverUsername(this.state.state.username, this.state.state.currentChannel))
        MessageApi.sendMessage(this.state.state.currentChannel, encryptedMessage, this.state.state.username);
    };

    private async loadChannels(username: string) {
        if (this.channelsListener) this.channelsListener();
        this.channelsListener = ChannelsApi.listenUpdates(username, (error, channels) => {
            this.state.setState({ channels, error });
        });
        const channels = await ChannelsApi.getChannels(username);
        this.state.setState({ channels });
    }

    private loadMessages = async (channel: IChannel) => {
        const encryptedMessages = await MessageApi.loadMessages(channel);
        const decryptedBodies = await Promise.all(encryptedMessages.map(m => this.VirgilApi!.decrypt(m.body)));
        encryptedMessages.forEach((m, i) => { m.body = decryptedBodies[i] })
        this.state.setState({ messages: encryptedMessages, currentChannel: channel });
    }

    private handleAuthStateChange = async (user: firebase.User | null) => {
        if (user) {
            const username = user.email!.replace('@virgilfirebase.com', '');
            const token = await user.getIdToken();
            this.VirgilApi = new VirgilApi(username, token);
            const hasPrivateKey = await this.VirgilApi.keyStorage.exists(username);
            if (!hasPrivateKey) await this.VirgilApi.createCard();
            this.state.setState({ username });
            this.loadChannels(username);
        } else {
            this.VirgilApi = undefined;
            this.state.setState({ username: null });
        }
    };

}

export default new CoreApi();
