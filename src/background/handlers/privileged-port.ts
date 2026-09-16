import { Runtime, runtime } from 'webextension-polyfill';

import { MainStore } from '@background/redux/get-main-store';
import { changePassword } from '@background/redux/sagas/actions';

import { isTrustedUiSender } from './trusted-sender';
import {
  UNLOCK_REQUEST_TYPE,
  VERIFY_PASSWORD_REQUEST_TYPE,
  handleUnlockRequest
} from './unlock-requests';

export const CHANGE_PASSWORD_REQUEST_TYPE = 'CHANGE_PASSWORD_REQUEST' as const;

const POPUP_PAGE = '/popup.html';
const SIGNATURE_REQUEST_PAGE = '/signature-request.html';
const CONNECT_TO_APP_PAGE = '/connect-to-app.html';
const ONBOARDING_PAGE = '/onboarding.html';

// isTrustedUiSender proves "an extension page"; it does not prove "a page that
// needs this".
export const ALLOWED_PAGES: Record<string, readonly string[]> = {
  [CHANGE_PASSWORD_REQUEST_TYPE]: [POPUP_PAGE],
  // UnlockVaultPage is mounted by LockedRouter on all three; admitting connect-to-app
  // is safe because the background, not the caller, computes the cipher.
  [UNLOCK_REQUEST_TYPE]: [
    POPUP_PAGE,
    SIGNATURE_REQUEST_PAGE,
    CONNECT_TO_APP_PAGE
  ],
  [VERIFY_PASSWORD_REQUEST_TYPE]: [
    POPUP_PAGE,
    SIGNATURE_REQUEST_PAGE,
    CONNECT_TO_APP_PAGE,
    ONBOARDING_PAGE
  ]
};

export function isAllowedPage(
  type: string,
  sender: Runtime.MessageSender
): boolean {
  if (sender.url == null) {
    return false;
  }

  const pages = ALLOWED_PAGES[type];

  return pages != null && pages.includes(new URL(sender.url).pathname);
}

function isChangePasswordRequestPayload(
  payload: unknown
): payload is { currentPassword: string; password: string } {
  const p = payload as
    Partial<{ currentPassword: string; password: string }> | null | undefined;

  if (p == null) {
    return false;
  }

  return (
    typeof p.currentPassword === 'string' &&
    typeof p.password === 'string' &&
    p.password.length > 0
  );
}

/**
 * `null` means refused or unknown: the caller disconnects without answering.
 */
export async function handlePrivilegedRequest(
  request: { type: string; payload?: unknown },
  sender: Runtime.MessageSender,
  store: MainStore
): Promise<unknown | null> {
  if (!Object.hasOwn(ALLOWED_PAGES, request.type)) {
    return null;
  }

  if (!isTrustedUiSender(sender) || !isAllowedPage(request.type, sender)) {
    // Same-extension only, and origin only — a content script or web page can
    // connect to this port too, and its sender.url can carry a query string.
    if (sender.id === runtime.id) {
      console.warn(
        'Background: privileged port request rejected for sender:',
        sender.url != null ? new URL(sender.url).origin : undefined
      );
    }
    return null;
  }

  // handleUnlockRequest's own `null` means "not my type", not "refused" —
  // distinct from this function's `null`, already spent on the sender/page gate.
  if (
    request.type === UNLOCK_REQUEST_TYPE ||
    request.type === VERIFY_PASSWORD_REQUEST_TYPE
  ) {
    return handleUnlockRequest(request, store);
  }

  // Explicit type match, not "the only key in ALLOWED_PAGES today": another
  // sub-handler's `null` refusal must not fall through into changePassword.
  if (request.type === CHANGE_PASSWORD_REQUEST_TYPE) {
    if (!isChangePasswordRequestPayload(request.payload)) {
      return null;
    }

    // The ack is "received and dispatched", not "completed" —
    // `changePasswordSaga` reports its outcome through `sagaError`.
    store.dispatch(changePassword(request.payload));
    return { accepted: true };
  }

  return null;
}

/**
 * The message listener MUST be attached synchronously: on a cold service-worker
 * start a message already in flight reaches only listeners present at that
 * moment, and awaiting the store first drops it with no disconnect and no retry.
 */
export function attachPrivilegedPort(
  port: Runtime.Port,
  getStore: () => Promise<MainStore>
): void {
  port.onMessage.addListener(message => {
    void (async () => {
      const store = await getStore();
      const result = await handlePrivilegedRequest(
        message as { type: string; payload?: unknown },
        port.sender ?? {},
        store
      );

      if (result == null) {
        port.disconnect();
        return;
      }

      port.postMessage(result);
    })().catch((error: unknown) => {
      // Never the raw error: some middleware paths attach the dispatched
      // action — and therefore both passwords — to a thrown error object.
      console.error(
        'privileged port: handler failed',
        error instanceof Error ? error.message : 'unknown'
      );
      port.disconnect();
    });
  });
}
