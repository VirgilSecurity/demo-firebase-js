import React from 'react';
import firebase from 'firebase';
import { withRouter, RouteComponentProps, Redirect } from 'react-router';
import { Routes } from '../services/Routes';
import ChatWindow from '../components/ChatWindow';
import ChatModel from '../models/ChatModel';
import UserApi from '../services/UserApi';

export interface IChatPageProps extends RouteComponentProps<{}> {}

class ChatPage extends React.Component<IChatPageProps> {

    signOut = () => {
        this.props.history.push(Routes.auth);
        firebase.auth().signOut();
    };

    render() {
        if (!UserApi.instance.virgilE2ee) return <Redirect to={Routes.auth} />
        const chatModel = new ChatModel(UserApi.instance.virgilE2ee)
        return <ChatWindow signOut={this.signOut} model={chatModel} />;
    }
}

export default withRouter(ChatPage);
