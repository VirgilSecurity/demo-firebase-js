import React from 'react';
import styled from 'styled-components';
import Channels from '../components/Channels';
import Messages from '../components/Messages';
import MessageField from '../components/MessageField';
import { PrimaryButton, LinkButton } from '../components/Primitives';
import ChatModel from '../models/ChatModel';
import { IChannel } from '../models/ChannelModel';
import { IAppStore } from '../models/AppState';

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

const RightSide = styled.span`
    color: white;
`;

export interface IChatPageProps {
    model: ChatModel;
    store: IAppStore;
    signOut: () => void;
}

export default class ChatPage extends React.Component<IChatPageProps> {
    model = this.props.model;

    componentWillUnmount() {
        this.model.unsubscribe();
    }

    createChannel = async () => {
        const receiver = prompt('receiver', '');
        if (!receiver) return alert('Add receiver please');
        try {
            await this.model.channelsList.createChannel(receiver);
        } catch (e) {
            alert(e.message);
        }
    };

    selectChannel = (channelInfo: IChannel) => this.model.listenMessages(channelInfo);

    render() {
        if (this.props.store.error) alert(this.props.store.error);
        return (
            <ChatContainer>
                <Header>
                    <LinkButton color="white" href="https://virgilsecurity.com/" target="_blank">
                        Virgilgram
                    </LinkButton>
                    <RightSide>
                        {this.props.store.username}
                        <LinkButton color="white" onClick={this.props.signOut}>
                            logout
                        </LinkButton>
                    </RightSide>
                </Header>
                <ChatLayout>
                    <SideBar>
                        <Channels
                            onClick={this.selectChannel}
                            username={this.props.store.username!}
                            channels={this.props.store.channels}
                        />
                        <BottomPrimaryButton onClick={this.createChannel}>
                            New Channel
                        </BottomPrimaryButton>
                    </SideBar>
                    <ChatWorkspace>
                        {this.props.store.currentChannel ? (
                            <React.Fragment>
                                <Messages messages={this.props.store.messages} />
                                <MessageField handleSend={this.model.sendMessage} />
                            </React.Fragment>
                        ) : (
                            'Select Channel First'
                        )}
                    </ChatWorkspace>
                </ChatLayout>
            </ChatContainer>
        );
    }
}
