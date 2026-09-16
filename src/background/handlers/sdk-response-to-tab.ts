import { Runtime, tabs } from 'webextension-polyfill';

import { sagaError } from '@background/redux/app-events/actions';
import { MainStore } from '@background/redux/get-main-store';
import {
  selectOpenRequest,
  selectRequestStatus
} from '@background/redux/windowManagement/selectors';
import {
  SDK_RESPONSE_TO_TAB,
  SdkResponseToTabMessage
} from '@background/send-sdk-response-to-specific-tab';

import {
  NOTHING_DISPLAYS,
  RespondedDisplays,
  closeLedgerWindowsAfterResponse,
  markRequestResponded
} from './close-windows-on-response';
import { deliverViaOrigin } from './deliver-via-origin';
import { getLiveTabOrigin } from './tab-origin';
import { isTrustedUiSender } from './trusted-sender';
import { HandlerResult } from './types';

// Response windows are opened with `?origin=<dappOrigin>` in their query
// string, and `sender.url` is that page URL.
function recoverDappOrigin(url: string | undefined): string | null {
  if (!url) {
    return null;
  }
  try {
    return new URL(url).searchParams.get('origin');
  } catch {
    return null;
  }
}

// SECURITY: the dapp `action` may carry secret material, so this surfaced error
// references ONLY the tabId and a static reason.
function deliveryFailedError(tabId: unknown, fallbackDelivered: boolean) {
  return sagaError({
    source: 'sdk-response-to-tab',
    message: fallbackDelivered
      ? `SDK response delivery to tab ${tabId} failed; delivered via same-origin fallback`
      : `SDK response delivery to tab ${tabId} failed; no same-origin fallback available — response not delivered`
  });
}

// `connectResponse` and `switchAccountResponse` type their payload as a bare
// boolean, where only `false` is the throwaway cancel shape.
function isBenignDuplicate(payload: unknown): boolean {
  if (typeof payload === 'boolean') {
    return payload === false;
  }

  return (
    typeof payload === 'object' &&
    payload !== null &&
    (payload as { cancelled?: unknown }).cancelled === true
  );
}

// Deduped by `requestId` against the background store, the single writer: the
// first response for a request wins, and only status 'responded' drops one.
export async function handleSdkResponseToTab(
  message: unknown,
  sender: Runtime.MessageSender,
  store: MainStore
): Promise<HandlerResult> {
  const candidate = message as Partial<SdkResponseToTabMessage> | undefined;

  if (candidate?.type !== SDK_RESPONSE_TO_TAB) {
    return { handled: false };
  }

  // Defense-in-depth: this handler reroutes a response to an arbitrary dapp tab,
  // so only the extension's own UI pages may originate it. Silently drop.
  if (!isTrustedUiSender(sender)) {
    return { handled: true };
  }

  const { action, tabId } = candidate as SdkResponseToTabMessage;
  const requestId = action?.meta?.requestId;

  if (
    requestId != null &&
    selectRequestStatus(store.getState(), requestId) === 'responded'
  ) {
    // A dropped cancel is benign, a dropped signature never is, so the severity
    // splits on it. Identifiers ONLY — `action` carries secret material.
    const identifiers = { requestId, tabId, type: action?.type };

    if (isBenignDuplicate(action?.payload)) {
      console.warn(
        'sdk-response-to-tab: dropped a duplicate cancel',
        identifiers
      );
    } else {
      // Log-only: `SagaErrorBanner` renders `message` verbatim and untranslated,
      // so there is no user-facing copy for this yet.
      console.error(
        'sdk-response-to-tab: dropped a completed response — the result was lost',
        identifiers
      );
    }
    // Respond so the forwarding UI's `runtime.sendMessage` promise still
    // resolves; some callers await it before closing the window.
    return { handled: true, response: undefined };
  }

  // The descriptor, not the UI-supplied `tabId`, records who asked; read it
  // BEFORE `markRequestResponded`, whose tombstone drops those fields.
  const request =
    requestId != null
      ? selectOpenRequest(store.getState(), requestId)
      : undefined;

  // The approval window can outlive its descriptor; fall back to the window
  // url's `?origin=` rather than dropping a signature the user just produced.
  const expectedOrigin = request?.origin ?? recoverDappOrigin(sender.url);
  const frameId = request?.frameId;

  const validTab = Number.isInteger(tabId) && tabId >= 0;
  // Synchronous, so it can run before the optimistic mark below — anything
  // awaited there would reopen the double-delivery race.
  const tabIdMatchesRequest = request == null || tabId === request.tabId;

  let displays: RespondedDisplays = NOTHING_DISPLAYS;

  if (!validTab || !tabIdMatchesRequest) {
    // Mark responded only when the fallback ACTUALLY delivered, so that a later
    // duplicate dedupes while a valid retry can still get through.
    const delivered = await deliverViaOrigin(expectedOrigin, action, frameId);

    if (validTab) {
      console.error(
        'sdk-response-to-tab: response tab is not the requesting tab; response withheld',
        {
          requestId,
          tabId,
          expectedTabId: request?.tabId,
          type: action?.type,
          delivered
        }
      );
    }

    if (delivered > 0 && requestId != null) {
      displays = markRequestResponded(store, requestId);
    }
    store.dispatch(deliveryFailedError(tabId, delivered > 0));
    void closeLedgerWindowsAfterResponse(store, displays);
    return { handled: true, response: undefined };
  }

  // Mark responded BEFORE the await: `runtime.onMessage` handlers interleave at
  // every `await`, so the display snapshot must stay in this synchronous block.
  if (requestId != null) {
    displays = markRequestResponded(store, requestId);
  }

  // A tab that navigated away still has a live receiver, so check the origin;
  // top frame only, and this narrows the race rather than closing it.
  if (frameId == null || frameId === 0) {
    const liveOrigin = await getLiveTabOrigin(tabId);

    if (expectedOrigin == null || liveOrigin !== expectedOrigin) {
      const delivered = await deliverViaOrigin(expectedOrigin, action, frameId);

      console.error(
        'sdk-response-to-tab: target tab no longer hosts the requesting origin; response withheld',
        {
          requestId,
          tabId,
          expectedOrigin,
          liveOrigin,
          type: action?.type,
          delivered
        }
      );

      store.dispatch(deliveryFailedError(tabId, delivered > 0));
      void closeLedgerWindowsAfterResponse(store, displays);

      return { handled: true, response: undefined };
    }
  }

  try {
    // `all_frames: true` in every manifest, so a bare send reaches EVERY frame;
    // target the asking frame, and omit the option when none was recorded.
    await (frameId == null
      ? tabs.sendMessage(tabId, action)
      : tabs.sendMessage(tabId, action, { frameId }));
  } catch (error) {
    // Tab gone / no listener → try the same-origin fallback. The optimistic mark
    // above already deduped any retry; delivery failure is terminal by design.
    const delivered = await deliverViaOrigin(expectedOrigin, action, frameId);

    // Severity splits on the outcome — recovered via another same-origin tab, or
    // the signature the user produced is gone. Identifiers only.
    const identifiers = { requestId, tabId, type: action?.type, delivered };

    if (delivered > 0) {
      console.warn(
        'sdk-response-to-tab: delivery to tab failed; recovered via same-origin fallback',
        identifiers,
        error
      );
    } else {
      console.error(
        'sdk-response-to-tab: delivery to tab failed; response not delivered',
        identifiers,
        error
      );
    }

    store.dispatch(deliveryFailedError(tabId, delivered > 0));
  }

  void closeLedgerWindowsAfterResponse(store, displays);

  return { handled: true, response: undefined };
}
