import { applyMiddleware, createStore as createStoreRedux } from 'redux';

import rootAction from './root-action';
import rootReducer from './root-reducer';
import { composeEnhancers } from './utils';

export const createStore = (initialState: any) => {
  // configure middlewares
  const middlewares: any[] = [];
  // compose enhancers
  const enhancer = composeEnhancers(applyMiddleware(...middlewares));

  // create store
  const store = createStoreRedux(rootReducer, initialState, enhancer);

  return store;
};

export { rootAction };
