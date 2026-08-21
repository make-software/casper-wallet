import { Runtime } from 'webextension-polyfill';

import { MainStore } from '@background/redux/get-main-store';
import {
  CheckAccountNameIsTakenAction,
  CheckSecretKeyExistAction
} from '@background/redux/import-account-actions-should-be-removed';
import {
  selectVaultAccountsNames,
  selectVaultAccountsSecretKeysBase64
} from '@background/redux/vault/selectors';
import { selectWindowId } from '@background/redux/windowManagement/selectors';

import { isTrustedUiSender } from './trusted-sender';
import { HandlerResult } from './types';

// TODO: All below should be removed when Import Account is integrated with window
export function handleLegacyImport(
  action: { type: string },
  sender: Runtime.MessageSender,
  store: MainStore
): HandlerResult {
  const isLegacyImportRequest =
    action.type === 'check-secret-key-exist' ||
    action.type === 'check-account-name-is-taken' ||
    action.type === 'get-window-id';

  if (!isLegacyImportRequest) {
    return { handled: false };
  }

  // P0.1: these cases are a secret-key / account-name membership oracle and a
  // window-id disclosure — gate to trusted extension UI senders only (the
  // legitimate import-account-with-file window passes); silently ignore anyone
  // else, matching the no-response shape of the other `trusted-sender.ts` gates.
  if (!isTrustedUiSender(sender)) {
    return { handled: true };
  }

  switch (action.type) {
    case 'check-secret-key-exist': {
      const { secretKeyBase64 } = (action as any as CheckSecretKeyExistAction)
        .payload;
      const vaultAccountsSecretKeysBase64 = selectVaultAccountsSecretKeysBase64(
        store.getState()
      );

      const response = secretKeyBase64
        ? vaultAccountsSecretKeysBase64.includes(secretKeyBase64)
        : false;
      return { handled: true, response };
    }

    case 'check-account-name-is-taken': {
      const { accountName } = (action as any as CheckAccountNameIsTakenAction)
        .payload;
      const vaultAccountsNames = selectVaultAccountsNames(store.getState());
      const response = accountName
        ? vaultAccountsNames.includes(accountName)
        : false;
      return { handled: true, response };
    }

    case 'get-window-id': {
      const windowId = selectWindowId(store.getState());
      return { handled: true, response: windowId };
    }

    default:
      return { handled: false };
  }
}
