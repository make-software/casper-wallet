import { Runtime, runtime } from 'webextension-polyfill';

import { MainStore } from '@background/redux/get-main-store';
import { changePassword } from '@background/redux/sagas/actions';

import { isTrustedUiSender } from './private-state';

export const CHANGE_PASSWORD_REQUEST_TYPE = 'CHANGE_PASSWORD_REQUEST' as const;

const POPUP_PAGE = '/popup.html';

// isTrustedUiSender proves "an extension page"; it does not prove "a page that
// needs this". Same shape and same reasoning as vault-secrets.ts.
export const ALLOWED_PAGES: Record<string, readonly string[]> = {
  [CHANGE_PASSWORD_REQUEST_TYPE]: [POPUP_PAGE]
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
 * `null` means refused or unknown: the caller disconnects without answering,
 * matching `vault-secrets.ts`.
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
      // nosemgrep: cw-logging-secrets — logs the sender origin only
      console.warn(
        'Background: privileged port request rejected for sender:',
        sender.url != null ? new URL(sender.url).origin : undefined
      );
    }
    return null;
  }

  // Explicit type match, not just "the only key in ALLOWED_PAGES today": a
  // sub-handler for a different type can legitimately return `null` to mean
  // "refused", and without this check that would fall through into
  // dispatching changePassword with whatever payload that request carried.
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
 * The message listener MUST be attached synchronously. On a cold service-worker
 * start the page's already-sent message is delivered only to listeners present
 * at that moment; awaiting the store first drops it, and because the port is not
 * disconnected the caller's retry never fires and its promise never settles.
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
