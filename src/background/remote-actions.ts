import Browser from 'webextension-polyfill';
import { EmptyAction, PayloadAction } from 'typesafe-actions';

import { SendConnectStatusAction } from '@content/remote-actions';

export type PassToBackgroundAction =
  | RequestConnectionAction
  | SendConnectStatusAction
  | DisconnectedFromAppAction
  | GetIsConnected
  | GetActivePublicKey
  | GetVersion;

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

type GetIsConnected = PayloadAction<'get-is-connected', string>;

export const getIsConnected = (origin: string) => {
  const action: GetIsConnected = {
    type: 'get-is-connected',
    payload: origin
  };

  return Browser.runtime.sendMessage(action);
};

type GetActivePublicKey = EmptyAction<'get-active-public-key'>;

export const getActivePublicKey = () => {
  const action: GetActivePublicKey = {
    type: 'get-active-public-key'
  };

  return Browser.runtime.sendMessage(action);
};

type GetVersion = EmptyAction<'get-version'>;

export const getVersion = () => {
  const action: GetVersion = {
    type: 'get-version'
  };

  return Browser.runtime.sendMessage(action);
};
