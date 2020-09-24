import React from 'react';
import ChatPage from './pages/ChatPage';
import AuthPage from './pages/AuthPage';

import { createGlobalStyle } from 'styled-components';
import AppStore, { IAppStore } from './models/AppState';
import UserApi from './models/UserModel';

const GlobalStyle = createGlobalStyle`
    html {
        box-sizing: border-box;
        background-color: #fafafa;
        letter-spacing: 0.05em;
        font-family: Lato;
    }
    *, *:before, *:after {
        box-sizing: inherit;
    }

    @font-face {
        font-family: 'Lato';
        font-weight: 400;
        font-style: normal;
        font-display: optional;
        src: url('https://cdn.virgilsecurity.com/assets/fonts/Lato/Lato-Regular.eot');
        src:
            url('https://cdn.virgilsecurity.com/assets/fonts/Lato/Lato-Regular.eot?#iefix') format('embedded-opentype'),
            url('https://cdn.virgilsecurity.com/assets/fonts/Lato/Lato-Regular.woff2') format('woff2'),
            url('https://cdn.virgilsecurity.com/assets/fonts/Lato/Lato-Regular.woff') format('woff'),
            url('https://cdn.virgilsecurity.com/assets/fonts/Lato/Lato-Regular.ttf') format('truetype');
    }
    @font-face {
        font-family: 'Muller';
        font-weight: 400;
        font-style: normal;
        font-display: optional;
        src: url('https://cdn.virgilsecurity.com/assets/fonts/Muller/muller-regular.eot');
        src:
            url('https://cdn.virgilsecurity.com/assets/fonts/Muller/muller-regular.eot?#iefix') format('embedded-opentype'),
            url('https://cdn.virgilsecurity.com/assets/fonts/Muller/muller-regular.woff2') format('woff2'),
            url('https://cdn.virgilsecurity.com/assets/fonts/Muller/muller-regular.woff') format('woff'),
            url('https://cdn.virgilsecurity.com/assets/fonts/Muller/muller-regular.ttf') format('truetype');
    }

`;

export default class App extends React.Component<{}, IAppStore> {
    userModel: UserApi;
    store = new AppStore(this.setState.bind(this), () => this.state);
    
    constructor(props: {}) {
        super(props);
        this.state = this.store.defaultState;
        this.userModel = new UserApi(this.store);
    }

    render() {
        const isAuthPage = this.state.chatModel == null;
        const isChatPage = this.state.chatModel != null;
        return (
            <React.Fragment>
                <GlobalStyle />
                {isAuthPage && <AuthPage store={this.state as IAppStore} model={this.userModel} />}
                {isChatPage && <ChatPage store={this.state as IAppStore} model={this.state.chatModel!} />}
            </React.Fragment>
        );
    }
}
