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
 * Writes need no equivalent guard, for a different reason than the shape of the
 * write suggests. `{ ...map, [id]: json }` does define an own property, but the
 * copy immer makes when it finalizes the returned state ASSIGNS the keys, and
 * assigning a string to `__proto__` is a silent no-op — so a `__proto__`
 * payload is dropped rather than stored, and the map's prototype is untouched
 * either way (pinned in reducer.test.ts). It cannot arise regardless:
 * `handleSdkMethod` rejects that id at the message boundary for every approval
 * type, before anything is dispatched.
 */
export function getPayload(
  payloads: PayloadMap,
  requestId: string
): string | undefined {
  return Object.prototype.hasOwnProperty.call(payloads, requestId)
    ? payloads[requestId]
    : undefined;
}
