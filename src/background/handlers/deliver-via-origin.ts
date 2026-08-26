import { emitSdkEventToActiveTabsWithOrigin } from '@background/utils';

import { SdkMethod } from '@content/sdk-method';

// Same-origin delivery fallback. Returns the number of tabs the response was
// SUCCESSFULLY delivered to (0 when there is no recoverable origin, when the
// request came from a sub-frame, or when the broadcast matched no active
// same-origin tab). Wrapping the emit isolates a `tabs.query`-level rejection
// so the caller's error-surface dispatch still runs and the handler never
// rejects back to the signature page. That rejection is logged rather than
// discarded: it and "no active same-origin tab" both return 0, and the caller
// picks its banner copy from that 0.
export async function deliverViaOrigin(
  origin: string | null,
  action: SdkMethod,
  frameId?: number
): Promise<number> {
  if (!origin) return 0;

  // Frame ids are per-tab, so a sub-frame's id names a different frame — or no
  // frame at all — in whatever tab the origin match selects; there is no way to
  // identify the requesting document in another tab, and delivering to the
  // wrong one is both a leak and a loss. Only frame 0 is the same frame in
  // every tab, and the origin match already established that tab's top
  // document belongs to the dapp — so a non-zero frameId must not broadcast.
  // `undefined` (no descriptor — one of the residual descriptor-less paths)
  // keeps broadcasting unscoped.
  if (frameId != null && frameId !== 0) {
    console.error(
      'deliverViaOrigin: sub-frame response not broadcast — no other tab can be matched to it',
      { origin, type: action.type }
    );
    return 0;
  }

  try {
    return await (frameId === 0
      ? emitSdkEventToActiveTabsWithOrigin(origin, action, 0)
      : emitSdkEventToActiveTabsWithOrigin(origin, action));
  } catch (error) {
    // Identifiers only — `action` carries `signatureHex` / `encryptedMessage`
    // (see the SECURITY note in `sdk-response-to-tab.ts`).
    console.error(
      'deliverViaOrigin: same-origin fallback failed',
      { origin, type: action.type },
      error
    );
    return 0;
  }
}
