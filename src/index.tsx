import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './AppHooks';
import * as serviceWorker from './serviceWorker';

import Amplify from 'aws-amplify';
import aww_exports from './aws-exports';

Amplify.configure(aww_exports);

ReactDOM.render(<App />, document.getElementById('errTrackerId'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
