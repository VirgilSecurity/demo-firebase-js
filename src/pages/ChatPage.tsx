import React from 'react';
import firebase from 'firebase';
import ChatWindow from '../components/ChatWindow';
import ChatModel from '../models/ChatModel';
import { IAppStore } from '../models/AppState';

export interface IChatPageProps {
    store: IAppStore;
    model: ChatModel;
}

class ChatPage extends React.Component<IChatPageProps> {

    signOut = () => {
        firebase.auth().signOut();
    };

    render() {
        return <ChatWindow store={this.props.store} signOut={this.signOut} model={this.props.model} />;
    }
}

export default ChatPage;
