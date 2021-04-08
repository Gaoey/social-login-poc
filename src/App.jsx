import { EditAccount } from 'home/EditAccount';
import { Home } from 'home/Home';
import { Login } from 'login/Login';
import React from 'react';
import { Redirect, Route, Switch, useLocation } from 'react-router-dom';
import { Nav, PrivateRoute } from '_components';
import { randomString } from '_helpers'

function App() {
    const location = useLocation()
    const pathname = location.pathname || '';

    return (
        <div>
            <Nav />
            <div className="container pt-4">
                <Switch>
                    <Redirect from="/:url*(/+)" to={pathname.slice(0, -1)} />
                    <PrivateRoute exact path="/" component={Home} />
                    <PrivateRoute path="/edit/:id" component={EditAccount} />
                    <Route path="/login" component={Login} />
                    <Route path='/line-login' component={() => {
                        const lineClientId = process.env.REACT_APP_LINE_CLIENT_ID
                        const state = randomString()
                        window.location.href = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${lineClientId}&redirect_uri=https%3A%2F%2Flocalhost%3A3000&state=${state}&scope=profile`;
                        return null;
                    }} />
                    <Redirect from="*" to="/" />
                </Switch>
            </div>
        </div>
    );
}

export { App };
