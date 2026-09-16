import { VaultState } from './types';

type PayloadMap = VaultState['jsonById'] | VaultState['eip712ById'];

/**
 * The only sanctioned way to read `jsonById` / `eip712ById`: both are keyed by
 * dapp-controlled `requestId`, so a bare `map[requestId]` can read an INHERITED
 * `Object.prototype` member. Own properties only, so "is there a payload for
 * this request" has one answer. The write side is guarded in `storePayload`.
 */
export function getPayload(
  payloads: PayloadMap,
  requestId: string
): string | undefined {
  return Object.prototype.hasOwnProperty.call(payloads, requestId)
    ? payloads[requestId]
    : undefined;
}
