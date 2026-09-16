import { Request, WindowManagementState } from './types';

// `requestId` is page-controlled, so an oversized id must be refused before it
// can register and later overflow the `storage.session` mirror's write quota.
const MAX_REQUEST_ID_LENGTH = 256;

/**
 * The only sanctioned way to read the `requests` map. `requestId` is
 * dapp-controlled, so a bare `requests[requestId]` can read an INHERITED
 * `Object.prototype` member, and `!= null` and `?.status` then disagree about
 * whether an id is registered. Own properties only, so both agree.
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
 * `__proto__` is the one `Object.prototype` name that cannot be a key here: the
 * next map is built by assignment, and assigning `__proto__` sets the object's
 * PROTOTYPE rather than adding an entry. Also bounds length, so a multi-MB
 * dapp-supplied id cannot overflow the `storage.session` mirror's write quota.
 */
export function isStorableRequestId(requestId: string): boolean {
  return requestId !== '__proto__' && requestId.length <= MAX_REQUEST_ID_LENGTH;
}
