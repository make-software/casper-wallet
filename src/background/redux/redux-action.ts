import { ActionType } from 'typesafe-actions';
import * as vault from './vault/actions';
import * as deploys from './deploys/actions';
import * as windowManagement from './windowManagement/actions';

const reduxAction = {
  vault,
  deploys,
  windowManagement
};

export type ReduxAction = ActionType<typeof reduxAction>;

export function isReduxAction(action?: {
  type?: unknown;
  meta?: unknown;
}): action is ReduxAction {
  return typeof action?.type === 'string' && action.meta === undefined;
}

export default reduxAction;
