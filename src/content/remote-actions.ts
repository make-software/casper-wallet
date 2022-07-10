import { EmptyAction, PayloadAction } from 'typesafe-actions';
import Browser from 'webextension-polyfill';

export type RemoteAction =
  | GetActiveTabOriginAction
  | SendConnectStatusToActiveTabAction
  | SendActiveAccountChangedToActiveTabAction;

export type GetActiveTabOriginAction = EmptyAction<'get-active-tab-origin'>;

export const getActiveTabOrigin = async (
  currentWindow: boolean
): Promise<string> => {
  const action: GetActiveTabOriginAction = { type: 'get-active-tab-origin' };

  const tabs = await Browser.tabs.query({ active: true, currentWindow });
  return Browser.tabs.sendMessage(tabs[0].id as number, action);
};

interface SendAccountDetailsToActiveTab {
  isUnlocked: boolean;
  isConnected: boolean;
  activeKey: string;
}

export type SendConnectStatusToActiveTabAction = PayloadAction<
  'send-connect-status',
  SendAccountDetailsToActiveTab
>;

export const sendConnectStatusToActiveTab = async (
  payload: SendAccountDetailsToActiveTab,
  currentWindow: boolean = true
) => {
  const action: SendConnectStatusToActiveTabAction = {
    type: 'send-connect-status',
    payload
  };

  const tabs = await Browser.tabs.query({ active: true, currentWindow });
  return Browser.tabs.sendMessage(tabs[0].id as number, action);
};

type SendActiveAccountChangedToActiveTabAction = PayloadAction<
  'send-active-account-changed',
  SendAccountDetailsToActiveTab
>;

export const sendActiveAccountChangedToActiveTab = async (
  payload: SendAccountDetailsToActiveTab,
  currentWindow: boolean
) => {
  const action: SendActiveAccountChangedToActiveTabAction = {
    type: 'send-active-account-changed',
    payload
  };

  const tabs = await Browser.tabs.query({
    active: true,
    currentWindow
  });

  return Browser.tabs.sendMessage(tabs[0].id as number, action);
};

export type PassToBackgroundAction =
  | RequestConnectionAction
  | SendConnectStatusToActiveTabAction;

type RequestConnectionAction = PayloadAction<'request-connection', string>;

export const passToBackgroundRequestConnection = async (origin: string) => {
  const action: RequestConnectionAction = {
    type: 'request-connection',
    payload: origin
  };

  await Browser.runtime.sendMessage(action);
};
