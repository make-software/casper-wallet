import { compose } from 'redux';
import { composeWithDevTools } from 'remote-redux-devtools';
import { createStore } from '@popup/redux/index';
import { storage } from '@extend-chrome/storage';

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

export function createInitStore(reduxStorageKey: string) {
  let store: ReturnType<typeof createStore>;

  return async () => {
    const { [reduxStorageKey]: data } = await storage.local.get(
      reduxStorageKey
    );

    if (store == null) {
      store = createStore(data || {});

      store.subscribe(() => {
        const vault = store.getState();
        storage.local.set({ [reduxStorageKey]: vault }).catch(() => {
          // initialization workaround
        });
      });
    }

    return store;
  };
}
