import { EmptyAction } from 'typesafe-actions';
import Browser from 'webextension-polyfill';

export type RemoteAction = GetActiveTabOriginAction;

export type GetActiveTabOriginAction = EmptyAction<'get-active-tab-origin'>;

export const getActiveTabOrigin = async (): Promise<string> => {
  const action: GetActiveTabOriginAction = { type: 'get-active-tab-origin' };

  const tabs = await Browser.tabs.query({ active: true, currentWindow: true });
  return Browser.tabs.sendMessage(tabs[0].id as number, action);
};
