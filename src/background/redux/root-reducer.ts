import { combineReducers } from 'redux';

import { reducer as vault } from './vault/reducer';
import { reducer as deploys } from './deploys/reducer';
import { reducer as windowManagement } from './windowManagement/reducer';

const rootReducer = combineReducers({
  vault,
  deploys,
  windowManagement
});

export default rootReducer;
