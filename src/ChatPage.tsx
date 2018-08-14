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
    user: firebase.User | null;
    channels: IChannel[];
    messages: IMessage[];
    currentChannel: IChannel | null;
}

export default class ChatPage extends React.Component<IChatPageProps> {
    detachListener?: firebase.Unsubscribe;

    state = {
        user: firebase.auth().currentUser,
        channels: [],
        messages: [],
        currentChannel: null,
    };

    async componentDidMount() {
        firebase.auth().onAuthStateChanged(this.getUser);
    }

    getUser = async (user: firebase.User | null) => {
        if (user) {
            const channels = await ChannelsApi.getChannels(
                user.email!.replace('@virgilfirebase.com', ''),
            );

            this.setState({ user, channels });
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
        ChannelsApi.sendMessage(this.state.currentChannel!, message);
    };

    render() {
        if (!this.state.user) return <p>...loading</p>;
        return (
            <ChatLayout>
                <SideBar>
                    <button>new conversation</button>
                    <hr />
                    <Channels onClick={this.loadMessages} channels={this.state.channels} />
                </SideBar>
                <ChatWindow>
                    <Messages messages={this.state.messages} />
                    <MessageField handleSend={this.sendMessage} />
                </ChatWindow>
            </ChatLayout>
        );
    }
}
