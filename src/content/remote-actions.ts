import { EmptyAction, PayloadAction } from 'typesafe-actions';
import Browser from 'webextension-polyfill';

export type RemoteAction =
  | GetActiveTabOriginAction
  | SendConnectStatusAction
  | SendActiveAccountChangedAction
  | SendDisconnectAccountAction;

async function sendMessageToContent(
  action: RemoteAction,
  currentWindow: boolean
) {
  const tabs = await Browser.tabs.query({ active: true, currentWindow });
  return Browser.tabs.sendMessage(tabs[0].id as number, action);
}

export type GetActiveTabOriginAction = EmptyAction<'get-active-tab-origin'>;

export const getActiveTabOrigin = async (
  currentWindow: boolean
): Promise<string> => {
  const action: GetActiveTabOriginAction = { type: 'get-active-tab-origin' };
  return sendMessageToContent(action, currentWindow);
};

interface MessageAccountDetail {
  isUnlocked: boolean;
  isConnected: boolean;
  activeKey: string;
}

export type SendConnectStatusAction = PayloadAction<
  'send-connect-status',
  MessageAccountDetail
>;

export const sendConnectStatus = async (
  payload: MessageAccountDetail,
  currentWindow: boolean = true
) => {
  const action: SendConnectStatusAction = {
    type: 'send-connect-status',
    payload
  };

  return sendMessageToContent(action, currentWindow);
};

type SendActiveAccountChangedAction = PayloadAction<
  'send-active-account-changed',
  MessageAccountDetail
>;

export const sendActiveAccountChanged = async (
  payload: MessageAccountDetail,
  currentWindow: boolean
) => {
  const action: SendActiveAccountChangedAction = {
    type: 'send-active-account-changed',
    payload
  };

  return sendMessageToContent(action, currentWindow);
};

type SendDisconnectAccountAction = PayloadAction<
  'send-disconnect-account',
  MessageAccountDetail
>;

export const sendDisconnectAccount = async (
  payload: MessageAccountDetail,
  currentWindow: boolean
) => {
  const action: SendDisconnectAccountAction = {
    type: 'send-disconnect-account',
    payload
  };

  return sendMessageToContent(action, currentWindow);
};
