import { EmptyAction, PayloadAction } from 'typesafe-actions';
import Browser from 'webextension-polyfill';

export type RemoteAction =
  | FetchActiveTabOriginAction
  | SendConnectStatusAction
  | SendActiveAccountChangedAction
  | SendDisconnectAccountAction;

async function sendMessageToActiveTab(
  action: RemoteAction,
  currentWindow: boolean
) {
  // TODO: check this if that actually is a best practice?
  const tabs = await Browser.tabs.query({
    currentWindow: currentWindow,
    active: true
  });
  return Browser.tabs.sendMessage(tabs[0].id as number, action);
}

export type FetchActiveTabOriginAction = EmptyAction<'fetch-active-tab-origin'>;
// TODO: come up with conventions for remote actions names
export const fetchActiveTabOrigin = async (
  currentWindow: boolean
): Promise<string> => {
  const action: FetchActiveTabOriginAction = {
    type: 'fetch-active-tab-origin'
  };
  return sendMessageToActiveTab(action, currentWindow);
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

  return sendMessageToActiveTab(action, currentWindow);
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

  return sendMessageToActiveTab(action, currentWindow);
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

  return sendMessageToActiveTab(action, currentWindow);
};
