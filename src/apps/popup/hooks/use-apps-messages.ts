import { useCallback, useEffect } from 'react';
import { importAccount } from '@popup/redux/vault/actions';
import Browser, { Runtime } from 'webextension-polyfill';
import { useDispatch, useSelector } from 'react-redux';
import MessageSender = Runtime.MessageSender;
import {
  selectVaultAccountNames,
  selectVaultAccountSecretKeysBase64
} from '@popup/redux/vault/selectors';
import { selectWindowId } from '@popup/redux/windowManagement/selectors';
import { Account } from '@popup/redux/vault/types';

interface Message {
  type:
    | 'import-account'
    | 'check-name-is-taken'
    | 'check-key-is-imported'
    | 'get-window-id';
  payload: {
    account?: Account;
    accountName?: string;
    secretKeyBase64?: string;
  };
}

export function useAppsMessages() {
  const dispatch = useDispatch();

  const windowId = useSelector(selectWindowId);
  const existingVaultAccountNames = useSelector(selectVaultAccountNames);
  const existingVaultPrivateKeysBase64 = useSelector(
    selectVaultAccountSecretKeysBase64
  );

  const handleMessage = useCallback(
    async ({ type, payload }: Message, sender: MessageSender) => {
      switch (type) {
        case 'import-account':
          const { account } = payload;
          if (account) {
            dispatch(importAccount(account));
          }

          break;
        case 'check-key-is-imported':
          const { secretKeyBase64 } = payload;
          if (secretKeyBase64) {
            return existingVaultPrivateKeysBase64.includes(secretKeyBase64);
          }

          break;
        case 'check-name-is-taken':
          const { accountName } = payload;
          if (accountName) {
            return existingVaultAccountNames.includes(accountName as string);
          }

          break;

        case 'get-window-id':
          return windowId;
        default:
          throw new Error('Unknown message type');
      }
    },
    [
      dispatch,
      existingVaultAccountNames,
      existingVaultPrivateKeysBase64,
      windowId
    ]
  );

  useEffect(() => {
    Browser.runtime.onMessage.addListener(handleMessage);
    return () => {
      Browser.runtime.onMessage.removeListener(handleMessage);
    };
  }, [handleMessage]);
}
