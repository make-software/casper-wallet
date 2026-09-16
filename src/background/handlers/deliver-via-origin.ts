import { emitSdkEventToActiveTabsWithOrigin } from '@background/utils';

import { SdkMethod } from '@content/sdk-method';

// Same-origin delivery fallback. Returns the number of tabs the response was
// SUCCESSFULLY delivered to; the caller picks its banner copy from a 0.
export async function deliverViaOrigin(
  origin: string | null,
  action: SdkMethod,
  frameId?: number
): Promise<number> {
  if (!origin) return 0;

  // Frame ids are per-tab: only frame 0 is the same document in every tab, so a
  // sub-frame response cannot be matched to another tab and must not broadcast.
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
    // Identifiers only — `action` carries `signatureHex` / `encryptedMessage`.
    console.error(
      'deliverViaOrigin: same-origin fallback failed',
      { origin, type: action.type },
      error
    );
    return 0;
  }
}
