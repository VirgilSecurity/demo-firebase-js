import React from 'react';
import styled from 'styled-components';
import firebase from 'firebase';
import ChannelsApi, { IChannel } from './services/ChannelsApi';
import Channels from './components/Channels';
import Messages, { IMessage } from './components/Messages';
import MessageField from './components/MessageField';
import MessageApi from './services/MessagesApi';
import { PrimaryButton, LinkButton } from './components/Primitives';
import { withRouter, RouteComponentProps } from 'react-router';
import { Routes } from './services/Routes';
import CoreApi from './services/CoreApi';

const ChatLayout = styled.div`
    max-width: 1024px;
    min-width: 600px;
    margin: 0 auto;
    background-color: white;
`;

const Header = styled.header`
    width: 100%;
    height: 50px;
    background-color: #9e3621;
    display: flex;
    justify-content: space-between;
`;

const ChatWorkspace = styled.div`
    display: flex;
    height: calc(100vh - 50px);
`;

const SideBar = styled.aside`
    width: 250px;
    border-right: 2px solid grey;
    flex: 0 0 auto;
    height: 100%;
    display: flex;
    flex-direction: column;
`;

const ChatWindow = styled.main`
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`;

const BottomPrimaryButton = PrimaryButton.extend`
    margin: 10px 0px;
`;

export interface IChatPageProps {}
export interface IChatPageState {
    error: null | Error;
    username: string | null;
    channels: IChannel[];
    messages: IMessage[];
    currentChannel: IChannel | null;
}

class ChatPage extends React.Component<RouteComponentProps<IChatPageProps>, IChatPageState> {
    channelsListener?: firebase.Unsubscribe;
    messageListener?: firebase.Unsubscribe;

    state = CoreApi.state.state;

    componentDidMount() {
        CoreApi.state.on('change', this.setState.bind(this));
        // tslint:disable-next-line:no-any
        (window as any).$api = CoreApi;

    }

    sendMessage = async (message: string) => {
        MessageApi.sendMessage(this.state.currentChannel!, message, this.state.username!);
    };

    createChannel = async () => {
        const receiver = prompt('receiver', '');
        if (!receiver) return alert('Add receiver please');
        try {
            await ChannelsApi.createChannel(receiver, this.state.username!);
        } catch (e) {
            alert(e.message);
        }
    };

    signOut = () => {
        firebase.auth().signOut();
        this.props.history.push(Routes.auth);
    };

    render() {
        if (this.state.error) alert(this.state.error);
        if (!this.state.username) return null;
        return (
            <ChatLayout>
                <Header>
                    <LinkButton color="white" href="https://virgilsecurity.com/" target="_blank">
                        Virgilgram
                    </LinkButton>
                    <LinkButton color="white" onClick={this.signOut}>
                        logout
                    </LinkButton>
                </Header>
                <ChatWorkspace>
                    <SideBar>
                        <Channels
                            onClick={CoreApi.syncMessages}
                            username={this.state.username!}
                            channels={this.state.channels}
                        />
                        <BottomPrimaryButton onClick={this.createChannel}>
                            New Channel
                        </BottomPrimaryButton>
                    </SideBar>
                    <ChatWindow>
                        {this.state.currentChannel ? (
                            <>
                                <Messages messages={this.state.messages} />
                                <MessageField handleSend={CoreApi.sendMessage} />
                            </>
                        ) : (
                            'Please Select Channel'
                        )}
                    </ChatWindow>
                </ChatWorkspace>
            </ChatLayout>
        );
    }
}

export default withRouter(ChatPage);
