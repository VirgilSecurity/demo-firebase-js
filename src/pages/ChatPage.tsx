import React from 'react';
import firebase from 'firebase';
import { withRouter, RouteComponentProps, Redirect } from 'react-router';
import { Routes } from '../services/Routes';
import ChatWindow from '../components/ChatWindow';
import ChatModel from '../models/ChatModel';
import UserApi, { UserInfo } from '../services/UserApi';

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
        UserApi.instance.subscribeOnAuthChange(this.createChatModel)
    }

    componentDidMount() {
        if (UserApi.instance.userInfo) this.createChatModel(UserApi.instance.userInfo);
        else UserApi.instance.subscribeOnAuthChange(this.createChatModel);
    }
    
    componentWillUnmount() {
        UserApi.instance.subscribeOnAuthChange(null);
    }

    createChatModel = (userInfo: UserInfo) => {
        if (userInfo) {
            const { username, token } = userInfo;
            this.setState({ model: new ChatModel(username, token) })
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
