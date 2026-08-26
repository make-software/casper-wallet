import { Request, WindowManagementState } from './types';

// `requestId` is page-generated and page-controlled (`generateRequestId`,
// src/content/sdk.ts) — an oversized id must be refused here, at the SDK
// entry, before it can register and later overflow the `storage.session`
// mirror's write quota (session-store.ts).
const MAX_REQUEST_ID_LENGTH = 256;

/**
 * The only sanctioned way to read the `requests` map.
 *
 * `requests` is a plain object and `requestId` is dapp-controlled
 * (`generateRequestId`, src/content/sdk.ts, is page-side), so a bare
 * `requests[requestId]` can read an INHERITED `Object.prototype` member for
 * `__proto__`, `toString`, `constructor`, `valueOf` or `hasOwnProperty`.
 *
 * That matters because two readers disagreed about it: `requests[id] != null`
 * saw the inherited member and concluded "already registered", while
 * `requests[id]?.status` saw `undefined` and concluded "fresh". The SDK entry
 * guard used the second and the reducer used the first, so one of five string
 * literals produced an approval window for a request the store never
 * registered — outside cancellation on close, on supersede, the response dedup
 * and the window-open failure recovery alike.
 *
 * Own properties only, so both questions get the same answer.
 */
export function getRequest(
  requests: WindowManagementState['requests'],
  requestId: string
): Request | undefined {
  return Object.prototype.hasOwnProperty.call(requests, requestId)
    ? requests[requestId]
    : undefined;
}

/**
 * `__proto__` is the one `Object.prototype` name that cannot be a key here.
 * Building the next map copies entries by assignment, and assigning
 * `__proto__` sets the object's PROTOTYPE rather than adding an entry — the
 * descriptor would then be inherited by every later lookup in the map. The
 * other four (`toString`, `constructor`, `valueOf`, `hasOwnProperty`) store as
 * ordinary own properties once reads go through `getRequest`.
 *
 * Also bounds length: unchecked here, a multi-MB dapp-supplied id could
 * register, then overflow the `storage.session` mirror's write quota, and the
 * mirror's remove-on-reject wipes the whole thing.
 */
export function isStorableRequestId(requestId: string): boolean {
  return requestId !== '__proto__' && requestId.length <= MAX_REQUEST_ID_LENGTH;
}
