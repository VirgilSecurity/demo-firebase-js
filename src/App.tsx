import React from 'react';
import { Route, BrowserRouter as Router } from 'react-router-dom';
import ChatPage from './ChatPage';
import AuthPage from './AuthPage';

import { Routes } from './services/Routes';
import { injectGlobal } from 'styled-components';

injectGlobal`
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

export default class App extends React.Component {
    render() {
        return (
            <Router>
                <React.Fragment>
                    <Route exact path={Routes.index} component={ChatPage} />
                    <Route path={Routes.auth} component={AuthPage} />
                </React.Fragment>
            </Router>
        );
    }
}
