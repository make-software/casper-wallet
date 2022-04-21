import { applyMiddleware, configureStore } from '@reduxjs/toolkit';
import rootAction from './root-action';
import rootReducer from './root-reducer';
import { composeEnhancers } from './utils';

export const createStore = (initialState: any) => {
  // configure middlewares
  const middleware: any[] = [];
  // compose enhancers
  const enhancers = composeEnhancers(applyMiddleware(...middleware));

  // create store
  return configureStore({
    reducer: rootReducer,
    preloadedState: initialState,
    enhancers,
    middleware,
    devTools: process.env.NODE_ENV === 'development'
  });
};

export { rootAction };
