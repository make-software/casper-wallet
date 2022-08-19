import { EmptyAction, PayloadAction } from 'typesafe-actions';
import browser from 'webextension-polyfill';

import { Account } from '@src/apps/popup/redux/vault/types';

export type RemoteAction =
  | SendImportedAccountAction
  | CheckAccountNameIsTakenAction
  | CheckSecretKeyExistAction
  | GetWindowIdAction;

export type SendImportedAccountAction = PayloadAction<
  'send-imported-account',
  { account: Account }
>;
export const sendImportedAccount = (account: Account): Promise<boolean> => {
  const action: SendImportedAccountAction = {
    type: 'send-imported-account',
    payload: {
      account: account
    }
  };
  return browser.runtime.sendMessage(action);
};

export type CheckAccountNameIsTakenAction = PayloadAction<
  'check-account-name-is-taken',
  { accountName: string }
>;

export const checkAccountNameIsTaken = (value: string): Promise<boolean> => {
  const action: CheckAccountNameIsTakenAction = {
    type: 'check-account-name-is-taken',
    payload: {
      accountName: value
    }
  };
  return browser.runtime.sendMessage(action);
};

export type CheckSecretKeyExistAction = PayloadAction<
  'check-secret-key-exist',
  { secretKeyBase64: string }
>;
export const checkSecretKeyExist = (
  secretKeyBase64: string
): Promise<boolean> => {
  const action: CheckSecretKeyExistAction = {
    type: 'check-secret-key-exist',
    payload: {
      secretKeyBase64
    }
  };
  return browser.runtime.sendMessage(action);
};

export type GetWindowIdAction = EmptyAction<'get-window-id'>;

export const getWindowId = (): Promise<number | null> => {
  const action: GetWindowIdAction = { type: 'get-window-id' };
  return browser.runtime.sendMessage(action);
};
