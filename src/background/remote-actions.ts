import Browser from 'webextension-polyfill';
import { PayloadAction } from 'typesafe-actions';

import { SendConnectStatusAction } from '@content/remote-actions';

export type PassToBackgroundAction =
  | RequestConnectionAction
  | SendConnectStatusAction
  | DisconnectedFromAppAction;

type RequestConnectionAction = PayloadAction<'request-connection', string>;

export const passToBackgroundRequestConnection = async (origin: string) => {
  const action: RequestConnectionAction = {
    type: 'request-connection',
    payload: origin
  };

  await Browser.runtime.sendMessage(action);
};

type DisconnectedFromAppAction = PayloadAction<'disconnected-from-app', string>;

export const passToBackgroundDisconnectedFromApp = async (origin: string) => {
  const action: DisconnectedFromAppAction = {
    type: 'disconnected-from-app',
    payload: origin
  };

  await Browser.runtime.sendMessage(action);
};
