import React from 'react';
import styled from 'styled-components';
import firebase from 'firebase';
import ChannelsApi from './services/ChannelsApi';
import Channels from './components/Channels';
import { IChannel } from './components/Channels';
import Messages, { IMessage } from './components/Messages';
import MessageField from './components/MessageField';

const ChatLayout = styled.div`
    display: flex;
    max-width: 1024px;
    min-width: 600px;
    margin: 0 auto;
    border-left: 2px solid lightgrey;
    border-right: 2px solid lightgrey;
`;

const SideBar = styled.aside`
    width: 250px;
    height: 100vh;
    border-right: 2px solid grey;
    flex: 0 0 auto;
`;

const ChatWindow = styled.main`
    width: 100%;
    height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
`;

export interface IChatPageProps {}
export interface IChatPageState {
    user: string | null;
    channels: IChannel[];
    messages: IMessage[];
    currentChannel: IChannel | null;
}

export default class ChatPage extends React.Component<IChatPageProps> {
    detachListener?: firebase.Unsubscribe;

    state = {
        username: null,
        channels: [],
        messages: [],
        currentChannel: null,
    };

    async componentDidMount() {
        firebase.auth().onAuthStateChanged(this.getUser);
    }

    getUser = async (user: firebase.User | null) => {
        if (user) {
            const username = user.email!.replace('@virgilfirebase.com', '');
            const channels = await ChannelsApi.getChannels(username);

            this.setState({ username, channels });
        }
    };

    loadMessages = async (channel: IChannel) => {
        const messages = await ChannelsApi.loadMessages(channel);
        if (this.detachListener) this.detachListener();
        this.detachListener = ChannelsApi.listenUpdates(channel, (err, updatedMessages) =>
            this.setState({ messages: updatedMessages }),
        );

        this.setState({ messages, currentChannel: channel });
    };

    sendMessage = async (message: string) => {
        ChannelsApi.sendMessage(this.state.currentChannel!, message, this.state.username!);
    };

    createChannel = () => {
        const receiver = prompt('receiver', '');
        if (!receiver) return alert('Add receiver please');
        ChannelsApi.createChannel(receiver, this.state.username!);
    }

    render() {
        if (!this.state.username) return <p>...loading</p>;
        return (
            <ChatLayout>
                <SideBar>
                    <button onClick={this.createChannel}>new conversation</button>
                    <hr />
                    <Channels
                        onClick={this.loadMessages}
                        username={this.state.username!}
                        channels={this.state.channels}
                    />
                </SideBar>
                <ChatWindow>
                    <Messages messages={this.state.messages} />
                    <MessageField handleSend={this.sendMessage} />
                </ChatWindow>
            </ChatLayout>
        );
    }
}
