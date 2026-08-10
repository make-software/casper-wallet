import { VaultState } from './types';

type PayloadMap = VaultState['jsonById'] | VaultState['eip712ById'];

/**
 * The only sanctioned way to read `jsonById` / `eip712ById`.
 *
 * Both are keyed by `requestId`, which is page-generated (`generateRequestId`,
 * src/content/sdk.ts) i.e. dapp-controlled, so a bare `map[requestId]` can read
 * an INHERITED `Object.prototype` member for `__proto__`, `toString`,
 * `constructor`, `valueOf` or `hasOwnProperty`. A dapp asking to sign with
 * `requestId: 'constructor'` would hand the signature page a function where it
 * expects transaction JSON, and `Transaction.fromJSON` would throw inside the
 * query — surfacing as INVALID_TRANSACTION_JSON for a request the store never
 * held a payload for.
 *
 * Own properties only, so "is there a payload for this request" has one answer.
 * Mirrors `getRequest` in windowManagement/request-map.ts, which exists for the
 * same reason on the same key space.
 *
 * The write side is guarded separately and deliberately, in `storePayload`:
 * `__proto__` is refused there rather than left to the shape of the write. What
 * the source looks like does not decide it — `tsconfig.json` targets es2017, so
 * the spread is emitted as `Object.assign`, and assignment runs the `__proto__`
 * setter instead of adding an entry. See the rationale on `storePayload`.
 */
export function getPayload(
  payloads: PayloadMap,
  requestId: string
): string | undefined {
  return Object.prototype.hasOwnProperty.call(payloads, requestId)
    ? payloads[requestId]
    : undefined;
}
