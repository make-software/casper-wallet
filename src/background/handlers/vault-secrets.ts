import { Runtime, runtime } from 'webextension-polyfill';

import { MainStore } from '@background/redux/get-main-store';
import { selectVaultIsLocked } from '@background/redux/session/selectors';
import { findNextDerivedIndex } from '@background/redux/vault/next-derived-index';
import {
  selectSecretPhrase,
  selectVaultAccountsNames,
  selectVaultDerivedAccounts
} from '@background/redux/vault/selectors';

import { SecretPhrase } from '@libs/crypto';

import { isTrustedUiSender } from './private-state';
import { HandlerResult } from './types';

export const SECRET_PHRASE_REQUEST_TYPE = 'SECRET_PHRASE_REQUEST' as const;
export const SUGGESTED_ACCOUNT_NAME_REQUEST_TYPE =
  'SUGGESTED_ACCOUNT_NAME_REQUEST' as const;

const POPUP_PAGE = '/popup.html';

// isTrustedUiSender proves "an extension page"; it does not prove "a page that
// needs this". Without the per-page allowlist an XSS in connect-to-app — which
// renders dapp-controlled origin, favicon and site name — could simply ask for the
// phrase. Same shape as the request-window allowlist in open-request-windows.ts.
// The export-keys window is popup.html too (sagas/export-keys-window-saga.ts:28).
const ALLOWED_PAGES: Record<string, readonly string[]> = {
  [SECRET_PHRASE_REQUEST_TYPE]: [POPUP_PAGE],
  [SUGGESTED_ACCOUNT_NAME_REQUEST_TYPE]: [POPUP_PAGE]
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
      // Origin only: a content-script sender's full URL could carry tokens.
      const senderOrigin =
        sender.url != null ? new URL(sender.url).origin : undefined;
      console.warn(
        'Background: vault-secrets request rejected for sender:',
        senderOrigin
      );
    }
    // An empty answer, not silence: a pending promise would hang a legitimate page.
    return { handled: true, response: null };
  }

  const state = store.getState();

  // Today lockVaultSaga empties the vault, so this is belt-and-braces — and it is
  // the only thing keeping this handler from becoming a lock bypass if the
  // decrypted vault ever survives a soft lock.
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

    default:
      return { handled: false };
  }
}

/** UI side. Only pages listed in ALLOWED_PAGES get an answer. */
export function fetchSecretPhrase(): Promise<SecretPhrase | null> {
  return runtime.sendMessage({ type: SECRET_PHRASE_REQUEST_TYPE });
}

/** UI side. Only pages listed in ALLOWED_PAGES get an answer. */
export function fetchSuggestedAccountName(): Promise<string | null> {
  return runtime.sendMessage({ type: SUGGESTED_ACCOUNT_NAME_REQUEST_TYPE });
}
