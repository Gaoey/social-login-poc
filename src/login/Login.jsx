import React from 'react';
import FacebookLogin from './FacebookLogin';
import GoogleLogin from './GoogleLogin';
import LineLogin from './LineLogin';

function Login({ history }) {

    return (
        <div className="col-md-6 offset-md-3 mt-5 text-center">
            <div className="card">
                <h4 className="card-header">Social Login</h4>
                <FacebookLogin history={history} />
                <GoogleLogin history={history} />
                <LineLogin history={history} />
            </div>
        </div>
    );
}

export { Login };
