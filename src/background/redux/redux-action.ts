import { ActionType } from 'typesafe-actions';

import * as accountInfo from './account-info/actions';
import * as activeOriginFavicon from './active-origin-favicon/actions';
import * as activeOrigin from './active-origin/actions';
import * as appEvents from './app-events/actions';
import * as contacts from './contacts/actions';
import * as keys from './keys/actions';
import * as lastActivityTime from './last-activity-time/actions';
import * as ledger from './ledger/actions';
import * as loginRetryCount from './login-retry-count/actions';
import * as loginRetryLockoutTime from './login-retry-lockout-time/actions';
import * as rateApp from './rate-app/actions';
import * as recentRecipientPublicKeys from './recent-recipient-public-keys/actions';
import * as sagas from './sagas/actions';
import * as session from './session/actions';
import * as settings from './settings/actions';
import * as trustedWasm from './trusted-wasm/actions';
import * as vaultCipher from './vault-cipher/actions';
import * as vault from './vault/actions';
import * as windowManagement from './windowManagement/actions';

const reduxAction = {
  sagas,
  vaultCipher,
  loginRetryCount,
  vault,
  keys,
  windowManagement,
  session,
  loginRetryLockoutTime,
  lastActivityTime,
  activeOrigin,
  activeOriginFavicon,
  settings,
  recentRecipientPublicKeys,
  accountInfo,
  contacts,
  rateApp,
  ledger,
  appEvents,
  trustedWasm
};

export type ReduxAction = ActionType<typeof reduxAction>;

export function isReduxAction(action?: {
  type?: unknown;
  meta?: unknown;
}): action is ReduxAction {
  return typeof action?.type === 'string';
}

export default reduxAction;
