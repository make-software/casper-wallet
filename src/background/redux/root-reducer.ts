import { combineReducers } from 'redux';

import { reducer as vault } from './vault/reducer';
import { reducer as deploys } from './deploys/reducer';
import { reducer as windowManagement } from './windowManagement/reducer';
import { reducer as session } from './session/reducer';

const rootReducer = combineReducers({
  vault,
  deploys,
  windowManagement,
  session
});

export default rootReducer;
