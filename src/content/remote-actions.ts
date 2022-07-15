import { EmptyAction, PayloadAction } from 'typesafe-actions';
import Browser from 'webextension-polyfill';

export type RemoteAction =
  | GetActiveTabOriginAction
  | SendConnectStatusAction
  | SendActiveAccountChangedAction
  | SendDisconnectedAccountAction;

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

type SendDisconnectedAccountAction = PayloadAction<
  'send-disconnected-account',
  MessageAccountDetail
>;

export const sendDisconnectedAccount = async (
  payload: MessageAccountDetail,
  currentWindow: boolean
) => {
  const action: SendDisconnectedAccountAction = {
    type: 'send-disconnected-account',
    payload
  };

  return sendMessageToContent(action, currentWindow);
};
