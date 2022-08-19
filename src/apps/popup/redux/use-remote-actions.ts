import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import browser, { Runtime } from 'webextension-polyfill';

import { importAccount } from '@popup/redux/vault/actions';
import {
  selectVaultAccountsNames,
  selectVaultAccountsSecretKeysBase64
} from '@popup/redux/vault/selectors';
import { selectWindowId } from '@popup/redux/windowManagement/selectors';

import { RemoteAction } from './remote-actions';

import MessageSender = Runtime.MessageSender;
export function useRemoteActions() {
  const dispatch = useDispatch();

  const windowId = useSelector(selectWindowId);
  const vaultAccountsNames = useSelector(selectVaultAccountsNames);
  const vaultAccountsSecretKeysBase64 = useSelector(
    selectVaultAccountsSecretKeysBase64
  );

  const handleMessage = useCallback(
    async (action: RemoteAction, sender: MessageSender) => {
      switch (action.type) {
        case 'send-imported-account':
          const { account } = action.payload;
          if (account) {
            dispatch(importAccount(account));
            return true;
          }
          return false;

        case 'check-secret-key-exist':
          const { secretKeyBase64 } = action.payload;
          if (secretKeyBase64) {
            return vaultAccountsSecretKeysBase64.includes(secretKeyBase64);
          }
          return false;

        case 'check-account-name-is-taken':
          const { accountName } = action.payload;
          if (accountName) {
            return vaultAccountsNames.includes(accountName as string);
          }
          return false;

        case 'get-window-id':
          return windowId;

        default:
          throw new Error(
            'Popup: Unknown message type: ' + JSON.stringify(action)
          );
      }
    },
    [dispatch, vaultAccountsNames, vaultAccountsSecretKeysBase64, windowId]
  );

  useEffect(() => {
    browser.runtime.onMessage.addListener(handleMessage);
    return () => {
      browser.runtime.onMessage.removeListener(handleMessage);
    };
  }, [handleMessage]);
}
