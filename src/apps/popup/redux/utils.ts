import { compose } from 'redux';
import { composeWithDevTools } from 'remote-redux-devtools';

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any;
  }
}

export const composeEnhancers =
  process.env.NODE_ENV === 'development'
    ? composeWithDevTools({
        name: 'Casper Signer',
        hostname: 'localhost',
        port: 8000,
        realtime: true
      })
    : compose;
