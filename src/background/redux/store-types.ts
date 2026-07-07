import rootReducer from './root-reducer';

export type RootState = ReturnType<typeof rootReducer>;
export type RootStateKey = Extract<keyof RootState, string>;

export type { ReduxAction as RootAction } from './redux-action';
