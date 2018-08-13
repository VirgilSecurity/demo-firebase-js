import React from 'react';
import styled from 'styled-components';
import firebase from 'firebase';
import { channels } from './model/Channels';
import Channels from './components/Channels';
import { IChannel } from './components/Channels';

const ChatLayout = styled.div`
    display: flex;
`;

const SideBar = styled.aside`
    width: 240px;
    height: 100vh;
    border-right: 2px solid grey;
`;

export interface IChatPageProps {}
export interface IChatPageState {
    user: firebase.User | null;
    channels: IChannel[];
}

export default class ChatPage extends React.Component<IChatPageProps> {
    state = {
        user: firebase.auth().currentUser,
        channels: [],
    };

    componentDidMount() {
        firebase.auth().onAuthStateChanged(user => {
            this.setState({ user });
            if (user) {
                const chan = channels.getChannels(user.email!.replace('@virgilfirebase.com', ''));
                chan.then(c => {
                    this.setState({ channels: c });
                });
            }
        });
    }

    loadChannel(channel: IChannel) {
        firebase
            .firestore()
            .collection('Channels')
            .doc(channel.id)
            .collection('Messages')
            .get()
            .then(querySnapshot => querySnapshot.docs.map(d => d.data()))
            .then(console.log)
    }

    render() {
        if (!this.state.user) return <p>...loading</p>;
        return (
            <ChatLayout>
                <SideBar>
                    <button>new conversation</button>
                    <hr />
                    <Channels loadChannel={this.loadChannel} channels={this.state.channels} />
                </SideBar>
            </ChatLayout>
        );
    }
}
