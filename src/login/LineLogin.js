import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { accountService } from '_services';
import * as R from 'ramda'
import * as Q from 'query-string'


export default function LineLogin() {
	const location = useLocation()
	useEffect(() => {
		// redirect to home if already logged in
		const qs = R.pathOr('', "state.from.search".split("."), location)
		const quesryString = Q.parse(qs);
		if (!R.isEmpty(quesryString)) {
			const code = quesryString.code
			const state = quesryString.state
			console.log({ qs })
			accountService.lineAuthenticate(code, state, qs)
		}
	}, [location]);

	console.log(accountService.accountValue)

	return (
		<div className="card-body">
			<button className="btn btn-line" onClick={accountService.lineLogin}>
				<i className="fab fa-line mr-1"></i>
        Log in with LINE
      </button>
		</div>
	)
}
