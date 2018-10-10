import React from 'react';
import firebase from 'firebase';
import { withRouter, RouteComponentProps, Redirect } from 'react-router';
import { Routes } from '../services/Routes';
import ChatWindow from '../components/ChatWindow';
import ChatModel from '../models/ChatModel';
import UserApi from '../services/UserApi';
import Facade from '../services/VirgilApi';

export interface IChatPageProps extends RouteComponentProps<{}> {}

export interface IChatPageState {
    model: ChatModel | null;
    isLoggedIn: boolean;
}

class ChatPage extends React.Component<IChatPageProps, IChatPageState> {

    state = {
        isLoggedIn: true,
        model: null
    }

    constructor(props: IChatPageProps) {
        super(props);
    }

    componentDidMount() {
        if (UserApi.instance.virgilE2ee) this.createChatModel(UserApi.instance.virgilE2ee);
        else UserApi.instance.subscribeOnAuthChange(this.createChatModel);
    }
    
    componentWillUnmount() {
        UserApi.instance.subscribeOnAuthChange(null);
    }

    createChatModel = (facade: Facade | null) => {
        if (facade) {
            this.setState({ model: new ChatModel(facade) })
        } else {
            this.setState({ isLoggedIn: false })
        }
    }

    signOut = () => {
        this.props.history.push(Routes.auth);
        firebase.auth().signOut();
    };

    render() {
        if (!this.state.isLoggedIn) return <Redirect to={Routes.auth} />
        if (!this.state.model) return null;
        return <ChatWindow signOut={this.signOut} model={this.state.model!} />;
    }
}

export default withRouter(ChatPage);
