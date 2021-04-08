import axios from 'axios';
import { randomString } from './utility'
import { accountService } from '_services';
import * as R from 'ramda'

// array in local storage for accounts
const accountsKey = 'react-social-login-accounts';
let accounts = JSON.parse(localStorage.getItem(accountsKey)) || [];

export function fakeBackend() {
    const methods = ['get', 'post', 'put', 'delete'];
    methods.forEach(method => {
        axios[`original${method}`] = axios[method];
        axios[method] = function (url, ...params) {
            return new Promise((resolve, reject) => {
                return handleRoute();

                function handleRoute() {
                    switch (true) {
                        case url.endsWith('/accounts/facebook/authenticate') && method === 'post':
                            console.log(`>> FAKE_BACKEND: POST /accounts/facebook/authenticate | ${url}`)
                            return facebookAuthenticate();
                        case url.endsWith('/accounts/google/authenticate') && method === 'post':
                            console.log(`>> FAKE_BACKEND: POST /accounts/google/authenticate | ${url}`)
                            return googleAuthenticate();
                        case url.endsWith('/accounts/line/authenticate') && method === 'post':
                            console.log(`>> FAKE_BACKEND: POST /accounts/line/authenticate | ${url}`)
                            return lineAuthenticate();
                        case url.endsWith('/accounts') && method === 'get':
                            console.log(`>> FAKE_BACKEND: get /accounts | ${url}`)
                            return getAccounts();
                        case url.match(/\/accounts\/\d+$/) && method === 'get':
                            console.log(`>> FAKE_BACKEND: get /accounts/* | ${url}`)
                            return getAccountById();
                        case url.match(/\/accounts\/\d+$/) && method === 'put':
                            console.log(`>> FAKE_BACKEND: put /accounts/* | ${url}`)
                            return updateAccount();
                        case url.match(/\/accounts\/\d+$/) && method === 'delete':
                            console.log(`>> FAKE_BACKEND: delete /accounts/* | ${url}`)
                            return deleteAccount();
                        default:
                            // pass through any requests not handled above
                            console.log(`>> FAKE_BACKEND: default pass through | ${url}`)
                            return axios[`original${method}`](url, body())
                                .then(response => resolve(response))
                                .catch(error => reject(error));
                    }
                }

                // route functions
                function facebookAuthenticate() {
                    console.log(`>> FAKE_BACKEND: authenticate()`)
                    const { accessToken } = body();

                    axios.get(`https://graph.facebook.com/v8.0/me?access_token=${accessToken}`)
                        .then(response => {
                            const data = R.pathOr(null, ["data"], response)
                            if (R.isNil(data)) return unauthorized()
                            if (data.error) return unauthorized(data.error.message);
                            let account = accounts.find(x => x.socialId === data.id);
                            if (!account) {
                                // create new account if first time logging in
                                account = {
                                    id: newAccountId(),
                                    socialId: data.id,
                                    brand: 'facebook',
                                    name: data.name,
                                    extraInfo: `This is some extra info about ${data.name} that is saved in the API`
                                }
                                accounts.push(account);
                                localStorage.setItem(accountsKey, JSON.stringify(accounts));
                            }

                            return ok({
                                ...account,
                                token: generateJwtToken(account)
                            });
                        });
                }

                function googleAuthenticate() {
                    console.log(`>> FAKE_BACKEND: authenticate()`)
                    const { res } = body()
                    if (R.isNil(res)) return unauthorized()
                    const profile = R.pathOr(null, ["profileObj"], res)
                    let account = accounts.find(x => x.socialId === profile.googleId);
                    if (!account) {
                        // create new account if first time logging in
                        account = {
                            id: newAccountId(),
                            socialId: profile.googleId,
                            brand: "google",
                            name: profile.name,
                            extraInfo: `This is some extra info about ${profile.email} that is saved in the API`
                        }
                        accounts.push(account);
                        localStorage.setItem(accountsKey, JSON.stringify(accounts));
                    }

                    return ok({
                        ...account,
                        token: generateJwtToken(account)
                    });
                }

                async function lineAuthenticate() {
                    console.log(`>> FAKE_BACKEND: lineAuthenticate()`)
                    const { code, state } = body()

                    const response = await axios.post(
                        "https://api.line.me/oauth2/v2.1/token",
                        `grant_type=authorization_code&code=${code}&redirect_uri=https://localhost:3000&client_id=${process.env.REACT_APP_LINE_CLIENT_ID}&client_secret=${process.env.REACT_APP_LINE_CLIENT_SECRET}`)

                    const lineAccessToken = R.pathOr('', "data.access_token".split("."), response)
                    const pResponse = await axios({
                        url: 'https://api.line.me/v2/profile',
                        headers: { 'Authorization': `Bearer ${lineAccessToken}` }
                    })
                    const profileResponse = R.pathOr(null, ["data"], pResponse)
                    if (R.isNil(profileResponse)) return unauthorized()
                    let account = accounts.find(x => x.socialId === profileResponse.userId);
                    if (!account) {
                        // create new account if first time logging in
                        account = {
                            id: newAccountId(),
                            socialId: profileResponse.userId,
                            brand: "line",
                            name: profileResponse.displayName,
                            pictureUrl: profileResponse.pictureUrl,
                            extraInfo: `${profileResponse.statusMessage}`
                        }
                        console.log({ account })
                        accounts.push(account);
                        localStorage.setItem(accountsKey, JSON.stringify(accounts));
                    }

                    return ok({
                        ...account,
                        token: generateJwtToken(account)
                    });
                }

                function getAccounts() {
                    console.log(`>> FAKE_BACKEND: getAccounts()`)
                    if (!isLoggedIn()) return unauthorized();
                    return ok(accounts);
                }

                function getAccountById() {
                    console.log(`>> FAKE_BACKEND: getAccountById()`)
                    if (!isLoggedIn()) return unauthorized();

                    let account = accounts.find(x => x.id === idFromUrl());
                    return ok(account);
                }

                function updateAccount() {
                    console.log(`>> FAKE_BACKEND: updateAccount()`)
                    if (!isLoggedIn()) return unauthorized();

                    let params = body();
                    let account = accounts.find(x => x.id === idFromUrl());

                    // update and save account
                    Object.assign(account, params);
                    localStorage.setItem(accountsKey, JSON.stringify(accounts));

                    return ok(account);
                }

                function deleteAccount() {
                    console.log(`>> FAKE_BACKEND: deleteAccount()`)
                    if (!isLoggedIn()) return unauthorized();

                    // delete account then save
                    accounts = accounts.filter(x => x.id !== idFromUrl());
                    localStorage.setItem(accountsKey, JSON.stringify(accounts));
                    return ok();
                }

                // helper functions

                function ok(body) {
                    console.log(`>> FAKE_BACKEND: ok()`)
                    // wrap in timeout to simulate server api call
                    setTimeout(() => resolve({ status: 200, data: body }), 500);
                }

                function unauthorized() {
                    console.log(`>> FAKE_BACKEND: unauthorized()`)
                    setTimeout(() => {
                        const response = { status: 401, data: { message: 'Unauthorized' } };
                        reject(response);

                        // manually trigger error interceptor
                        const errorInterceptor = axios.interceptors.response.handlers[0].rejected;
                        errorInterceptor({ response });
                    }, 500);
                }

                function isLoggedIn() {
                    return accountService.accountValue;
                }

                function idFromUrl() {
                    const urlParts = url.split('/');
                    return parseInt(urlParts[urlParts.length - 1]);
                }

                function body() {
                    if (['post', 'put'].includes(method))
                        return params[0];
                }

                function newAccountId() {
                    return accounts.length ? Math.max(...accounts.map(x => x.id)) + 1 : 1;
                }

                function generateJwtToken(account) {
                    console.log(`>> FAKE_BACKEND: generateJwtToken()`)
                    // create token that expires in 15 minutes
                    const tokenPayload = {
                        exp: Math.round(new Date(Date.now() + 15 * 60 * 1000).getTime() / 1000),
                        id: account.id
                    }
                    return `fake-jwt-token.${btoa(JSON.stringify(tokenPayload))}`;
                }

            });
        }
    });
}