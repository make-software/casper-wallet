import { ActionType } from 'typesafe-actions';
import * as sagas from './sagas/actions';
import * as vault from './vault/actions';
import * as vaultCipher from './vault-cipher/actions';
import * as keys from './keys/actions';
import * as deploys from './deploys/actions';
import * as windowManagement from './windowManagement/actions';
import * as session from './session/actions';

const reduxAction = {
  sagas,
  vaultCipher,
  vault,
  keys,
  deploys,
  windowManagement,
  session
};

export type ReduxAction = ActionType<typeof reduxAction>;

export function isReduxAction(action?: {
  type?: unknown;
  meta?: unknown;
}): action is ReduxAction {
  return typeof action?.type === 'string' && action.meta === undefined;
}

export default reduxAction;
