import React from 'react';
import { Route, BrowserRouter as Router } from 'react-router-dom';
import ChatPage from './ChatPage';
import AuthPage from './AuthPage';

import { Routes } from './model/Routes';

export default class App extends React.Component {
    render() {
        return (
            <Router>
                <React.Fragment>
                    <Route exact path={Routes.index} component={ChatPage} />
                    <Route path={Routes.singIn} component={AuthPage} />
                    <Route path={Routes.signUp} component={AuthPage} />
                </React.Fragment>
            </Router>
        );
    }
}
