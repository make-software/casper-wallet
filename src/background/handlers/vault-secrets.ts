import { Runtime, runtime } from 'webextension-polyfill';

import { MainStore } from '@background/redux/get-main-store';
import { selectVaultIsLocked } from '@background/redux/session/selectors';
import { findNextDerivedIndex } from '@background/redux/vault/next-derived-index';
import {
  selectSecretPhrase,
  selectVaultAccounts,
  selectVaultAccountsNames,
  selectVaultDerivedAccounts
} from '@background/redux/vault/selectors';

import { SecretPhrase } from '@libs/crypto';
import { requestWithRetry } from '@libs/messaging/request-with-retry';

import { isTrustedUiSender } from './trusted-sender';
import { HandlerResult } from './types';

export const SECRET_PHRASE_REQUEST_TYPE = 'SECRET_PHRASE_REQUEST' as const;
export const SUGGESTED_ACCOUNT_NAME_REQUEST_TYPE =
  'SUGGESTED_ACCOUNT_NAME_REQUEST' as const;
export const ACCOUNT_SECRET_KEYS_REQUEST_TYPE =
  'ACCOUNT_SECRET_KEYS_REQUEST' as const;

interface AccountSecretKeysRequest {
  type: typeof ACCOUNT_SECRET_KEYS_REQUEST_TYPE;
  payload: { accountNames: string[] };
}

const POPUP_PAGE = '/popup.html';
const SIGNATURE_REQUEST_PAGE = '/signature-request.html';

/**
 * isTrustedUiSender proves "an extension page", not "a page that needs this": without this
 * allowlist an XSS in a dapp-facing page could ask for the phrase. `/popup.html` covers the
 * export-keys window too — it is the same document, opened in a window of its own.
 */
const ALLOWED_PAGES: Record<string, readonly string[]> = {
  [SECRET_PHRASE_REQUEST_TYPE]: [POPUP_PAGE],
  [SUGGESTED_ACCOUNT_NAME_REQUEST_TYPE]: [POPUP_PAGE],
  [ACCOUNT_SECRET_KEYS_REQUEST_TYPE]: [POPUP_PAGE, SIGNATURE_REQUEST_PAGE]
};

function isAllowedPage(type: string, sender: Runtime.MessageSender): boolean {
  if (sender.url == null) {
    return false;
  }

  const pages = ALLOWED_PAGES[type];

  return pages != null && pages.includes(new URL(sender.url).pathname);
}

export function handleVaultSecrets(
  action: { type: string },
  sender: Runtime.MessageSender,
  store: MainStore
): HandlerResult {
  if (!Object.hasOwn(ALLOWED_PAGES, action.type)) {
    return { handled: false };
  }

  if (!isTrustedUiSender(sender) || !isAllowedPage(action.type, sender)) {
    if (sender.id === runtime.id) {
      const senderOrigin =
        sender.url != null ? new URL(sender.url).origin : undefined;
      // nosemgrep: cw-logging-secrets — logs the sender origin only, never vault contents
      console.warn(
        'Background: vault-secrets request rejected for sender:',
        senderOrigin
      );
    }
    return { handled: true, response: null };
  }

  const state = store.getState();

  // Belt-and-braces while lockVaultSaga empties the vault, but the only thing
  // keeping this handler from becoming a lock bypass if that ever changes.
  if (selectVaultIsLocked(state)) {
    return { handled: true, response: null };
  }

  switch (action.type) {
    case SECRET_PHRASE_REQUEST_TYPE: {
      const response: SecretPhrase | null = selectSecretPhrase(state);
      return { handled: true, response };
    }

    case SUGGESTED_ACCOUNT_NAME_REQUEST_TYPE: {
      const derivedAccounts = selectVaultDerivedAccounts(state);
      const existingNames = selectVaultAccountsNames(state);
      const index = findNextDerivedIndex(
        selectSecretPhrase(state),
        derivedAccounts
      );

      let sequenceNumber = index + 1;
      let name = `Account ${sequenceNumber}`;
      while (existingNames.includes(name)) {
        sequenceNumber++;
        name = `Account ${sequenceNumber}`;
      }

      return { handled: true, response: name };
    }

    case ACCOUNT_SECRET_KEYS_REQUEST_TYPE: {
      const { accountNames } = (action as AccountSecretKeysRequest).payload;
      const accounts = selectVaultAccounts(state);

      // Null prototype: the keys are user-chosen account names.
      const response: Record<string, string> = Object.create(null);

      for (const name of accountNames) {
        const account = accounts.find(account => account.name === name);
        // Only accounts that actually hold a key: download-account-keys relies on the
        // absence to skip watch-only accounts when building the zip.
        if (account != null && account.secretKey !== '') {
          response[name] = account.secretKey;
        }
      }

      return { handled: true, response };
    }

    default:
      return { handled: false };
  }
}

export function fetchSecretPhrase(): Promise<SecretPhrase | null> {
  return runtime.sendMessage({ type: SECRET_PHRASE_REQUEST_TYPE });
}

export function fetchSuggestedAccountName(): Promise<string | null> {
  return runtime.sendMessage({ type: SUGGESTED_ACCOUNT_NAME_REQUEST_TYPE });
}

export function fetchAccountSecretKeys(
  accountNames: string[]
): Promise<Record<string, string> | null> {
  return runtime.sendMessage({
    type: ACCOUNT_SECRET_KEYS_REQUEST_TYPE,
    payload: { accountNames }
  });
}

/**
 * Single-account convenience wrapper; empty string if the account holds no key
 * or the request failed. Never throws: callers already treat an empty key as
 * "cannot sign/decrypt here" and surface that.
 */
export async function fetchAccountSecretKey(
  accountName: string
): Promise<string> {
  try {
    const keys = await requestWithRetry(() =>
      fetchAccountSecretKeys([accountName])
    );

    return keys?.[accountName] ?? '';
  } catch {
    return '';
  }
}
