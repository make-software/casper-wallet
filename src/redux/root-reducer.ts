import { combineReducers } from 'redux';

import { reducer as vaultReducer } from './vault/reducer';

import { reducer as createVaultReducer } from '@src/pages/create-vault/reducer';

const rootReducer = combineReducers({
  vault: vaultReducer,
  createVaultPage: createVaultReducer
});

export default rootReducer;
