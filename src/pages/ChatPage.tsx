import React from 'react';
import firebase from 'firebase/app';
import ChatModel from '../models/ChatModel';
import { IAppStore } from '../models/AppState';
import Channels from '../components/Channels';
import Messages from '../components/Messages';
import MessageField from '../components/MessageField';
import { LinkButton } from '../components/Primitives';
import { IChannel } from '../models/ChannelModel';
import { ChatContainer, Header, RightSide, ChatLayout, SideBar, BottomPrimaryButton, ChatWorkspace } from '../components/ChatPrimitives';

export interface IChatPageProps {
    model: ChatModel;
    store: IAppStore;
}

export default class ChatPage extends React.Component<IChatPageProps> {
    
    componentWillUnmount() {
        this.props.model.unsubscribe();
    }

    createChannel = async () => {
        const receiver = prompt('receiver', '');
        if (!receiver) return alert('Add receiver please');
        try {
            await this.props.model.channelsList.createChannel(receiver);
        } catch (e) {
            alert(e.message);
        }
    };

    sendMessage = async (message: string) => {
        try {
            await this.props.model.sendMessage(message)
        } catch (e) {
            alert(e);
        }
    }

    selectChannel = (channelInfo: IChannel) => this.props.model.listenMessages(channelInfo);
    signOut = () => firebase.auth().signOut();

    render() {
        if (this.props.store.error) alert(this.props.store.error);
        return (
            <ChatContainer>
                <Header>
                    <LinkButton color="white" href="https://virgilsecurity.com/" target="_blank">
                        Virgilgram
                    </LinkButton>
                    <RightSide>
                        {this.props.model.email}
                        <LinkButton color="white" onClick={this.signOut}>
                            logout
                        </LinkButton>
                    </RightSide>
                </Header>
                <ChatLayout>
                    <SideBar>
                        <Channels
                            onClick={this.selectChannel}
                            username={this.props.model.email}
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
                                <MessageField handleSend={this.sendMessage} />
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