import React from 'react';
import styled from 'styled-components';
import firebase from 'firebase';
import { IChannel } from '../services/ChannelListModel';
import Channels from '../components/Channels';
import Messages, { IMessage } from '../components/Messages';
import MessageField from '../components/MessageField';
import { PrimaryButton, LinkButton } from '../components/Primitives';
import ChatModel from '../services/ChatModel';

const ChatContainer = styled.div`
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

const ChatLayout = styled.div`
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

const ChatWorkspace = styled.main`
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

export interface IChatPageProps {
    model: ChatModel;
    signOut: () => void;
}

export interface IChatPageState {
    error: null | Error;
    username: string | null;
    channels: IChannel[];
    messages: IMessage[];
    currentChannel: IChannel | null;
}

export default class ChatPage extends React.Component<IChatPageProps, IChatPageState> {
    channelsListener?: firebase.Unsubscribe;
    messageListener?: firebase.Unsubscribe;

    model = this.props.model;
    state = this.model.state.store;

    componentDidMount() {
        this.model.state.on('change', this.setState.bind(this));
        // tslint:disable-next-line:no-any
        (window as any).$api = ChatModel;
    }

    componentWillUnmount() {
        this.model.unsubscribe();
    }

    createChannel = async () => {
        const receiver = prompt('receiver', '');
        if (!receiver) return alert('Add receiver please');
        try {
            await this.model.channelsList.createChannel(receiver, this.model.username);
        } catch (e) {
            alert(e.message);
        }
    };

    selectChannel = (channelInfo: IChannel) => this.model.listenMessages(channelInfo);

    render() {
        if (this.state.error) alert(this.state.error);
        return (
            <ChatContainer>
                <Header>
                    <LinkButton color="white" href="https://virgilsecurity.com/" target="_blank">
                        Virgilgram
                    </LinkButton>
                    <LinkButton color="white" onClick={this.props.signOut}>
                        logout
                    </LinkButton>
                </Header>
                <ChatLayout>
                    <SideBar>
                        <Channels
                            onClick={this.selectChannel}
                            username={this.state.username!}
                            channels={this.state.channels}
                        />
                        <BottomPrimaryButton onClick={this.createChannel}>
                            New Channel
                        </BottomPrimaryButton>
                    </SideBar>
                    <ChatWorkspace>
                        {this.state.currentChannel ? (
                            <>
                                <Messages messages={this.state.messages} />
                                <MessageField handleSend={this.model.sendMessage} />
                            </>
                        ) : (
                            'Please Select Channel'
                        )}
                    </ChatWorkspace>
                </ChatLayout>
            </ChatContainer>
        );
    }
}
