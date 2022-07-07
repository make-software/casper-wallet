import { EmptyAction, PayloadAction } from 'typesafe-actions';
import Browser from 'webextension-polyfill';

export type RemoteAction =
  | GetActiveTabOriginAction
  | SendConnectStatusToActiveTabAction;

export type GetActiveTabOriginAction = EmptyAction<'get-active-tab-origin'>;

export const getActiveTabOrigin = async (): Promise<string> => {
  const action: GetActiveTabOriginAction = { type: 'get-active-tab-origin' };

  const tabs = await Browser.tabs.query({ active: true, currentWindow: true });
  return Browser.tabs.sendMessage(tabs[0].id as number, action);
};

interface SendConnectStatusDetails {
  isUnlocked: boolean;
  isConnected: boolean;
  activeKey: string;
}

export type SendConnectStatusToActiveTabAction = PayloadAction<
  'send-connect-status',
  SendConnectStatusDetails
>;

export const sendConnectStatusToActiveTab = async (
  payload: SendConnectStatusDetails
) => {
  const action: SendConnectStatusToActiveTabAction = {
    type: 'send-connect-status',
    payload
  };

  const tabs = await Browser.tabs.query({ active: true, currentWindow: true });
  return Browser.tabs.sendMessage(tabs[0].id as number, action);
};

export type PassToBackgroundAction = RequestConnectionAction;

type RequestConnectionAction = EmptyAction<'request-connection'>;

export const passToBackgroundRequestConnection = async () => {
  const action: RequestConnectionAction = {
    type: 'request-connection'
  };

  await Browser.runtime.sendMessage(action);
};
