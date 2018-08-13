import React from 'react';
import { Route } from 'react-router-dom';
import { Router } from 'react-router'
import { Provider } from 'mobx-react';
import ChatPage from './ChatPage';
import AuthPage from './AuthPage';
import Store from './model/Store';

import createBrowserHistory from 'history/createBrowserHistory'
import { syncHistoryWithStore, SynchronizedHistory } from 'mobx-react-router';
import { Routes } from './model/Routes';

class App extends React.Component {
    store = new Store()
    routerHistory: SynchronizedHistory;

    constructor(props: {}) {
        super(props);
        this.routerHistory = syncHistoryWithStore(createBrowserHistory(), this.store.router)
    }

    render() {
        return (
            <Provider store={this.store}>
                <Router history={this.routerHistory}>
                    <React.Fragment>
                        <Route exact path={Routes.index} component={ChatPage} />
                        <Route path={Routes.singIn} component={AuthPage} />
                        <Route path={Routes.signUp} component={AuthPage} />
                    </React.Fragment>
                </Router>
            </Provider>
        );
    }
}

export default App;
