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
