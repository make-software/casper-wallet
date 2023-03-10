import { ActionType } from 'typesafe-actions';
import * as sagas from './sagas/actions';
import * as vault from './vault/actions';
import * as vaultCipher from './vault-cipher/actions';
import * as loginRetryCount from './login-retry-count/actions';
import * as keys from './keys/actions';
import * as deploys from './deploys/actions';
import * as windowManagement from './windowManagement/actions';
import * as session from './session/actions';
import * as loginRetryLockoutTime from './login-retry-lockout-time/actions';
import * as timeoutDurationSetting from './timeout-duration-setting/actions';
import * as lastActivityTime from './last-activity-time/actions';
import * as activeOrigin from './active-origin/actions';

const reduxAction = {
  sagas,
  vaultCipher,
  loginRetryCount,
  vault,
  keys,
  deploys,
  windowManagement,
  session,
  loginRetryLockoutTime,
  timeoutDurationSetting,
  lastActivityTime,
  activeOrigin
};

export type ReduxAction = ActionType<typeof reduxAction>;

export function isReduxAction(action?: {
  type?: unknown;
  meta?: unknown;
}): action is ReduxAction {
  return typeof action?.type === 'string';
}

export default reduxAction;
