import { emitSdkEventToActiveTabsWithOrigin } from '@background/utils';

import { SdkMethod } from '@content/sdk-method';

// Same-origin delivery fallback. Returns the number of tabs the response was
// SUCCESSFULLY delivered to (0 when there is no recoverable origin, or when the
// broadcast matched no active same-origin tab). Wrapping the emit isolates a
// `tabs.query`-level rejection so the caller's error-surface dispatch still runs
// and the handler never rejects back to the signature page. That rejection is
// logged rather than discarded: it and "no active same-origin tab" both return
// 0, and the caller picks its banner copy from that 0.
export async function deliverViaOrigin(
  origin: string | null,
  action: SdkMethod
): Promise<number> {
  if (!origin) return 0;
  try {
    return await emitSdkEventToActiveTabsWithOrigin(origin, action);
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
