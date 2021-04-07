import React, { useEffect } from 'react';

import { accountService } from '_services';

export default function FacebookLogin({ history }) {
	useEffect(() => {
		// redirect to home if already logged in
		if (accountService.accountValue) {
			history.push('/');
		}
	}, [history]);

	return (
		<div className="card-body">
			<button className="btn btn-facebook" onClick={accountService.facebookLogin}>
				<i className="fa fa-facebook mr-1"></i>
        Login with Facebook
      </button>
		</div>
	)
}
