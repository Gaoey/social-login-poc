import React from 'react'
import { GoogleLogin } from 'react-google-login'
import { accountService } from '_services';

const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

export default function Login() {

    const onSuccess = (res) => {
        console.log('Login Success')
        accountService.googleLogin(res)
    }

    const onFailure = (res) => {
        console.log('Login Failed')
        console.log({ res })
    }

    return (
        <div>
            <GoogleLogin
                clientId={googleClientId}
                buttonText="Google Login"
                onSuccess={onSuccess}
                onFailure={onFailure}
                cookiePolicy={'single_host_origin'}
                isSignIn={true}
            />
        </div>
    )
}
