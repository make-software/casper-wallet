export type RequestStatus = 'open' | 'responded';

export type CancellableMethod =
  | 'connect'
  | 'switchAccount'
  | 'sign'
  | 'signMessage'
  | 'signTypedData'
  | 'decryptMessage';

// One request, one entry. `windowIds` is every window currently DISPLAYING this
// request — normally one approval window, but the Ledger permission flow opens a
// second window carrying the same requestId (`src/hooks/use-ledger.ts`), so a
// request can outlive the loss of any single window. Cancellation is driven by
// "this window displays it no longer", never by a timer.
//
// `readonly` throughout, `windowIds` included. `selectOpenRequests` hands its
// entries out with a shallow spread, so without it the store's own array leaves
// by reference — and `configureStore` runs with `immutableCheck: false`, so
// nothing catches an in-place mutation at runtime either. Since
// `cancelRequestsDisplacedBy` decides a request's fate purely from that array,
// a `request.windowIds.push(id)` on a selector result would silently rewrite
// the decision with no action dispatched. The reducer is already copy-on-write;
// this is the type saying so.
export type Request =
  | {
      readonly status: 'open';
      readonly tabId: number;
      readonly origin: string;
      readonly method: CancellableMethod;
      readonly windowIds: readonly number[];
      // A Ledger confirmation is in flight for this request. The device call
      // runs in the page that displays it, so reusing that page's window
      // navigates the document away and takes the HID session and the pending
      // signature with it — `openWindow` reads this to leave such a window
      // alone. Lives on the descriptor rather than in a slice-level set so it
      // cannot outlive what it describes: the tombstone replaces the whole
      // entry, and a detach shrinks `windowIds`, which is the other half of the
      // question. WALLET-1394.
      readonly awaitingDeviceConfirmation: boolean;
    }
  | { readonly status: 'responded' };

// Not exported: with `selectOpenRequests` narrowing on the discriminant rather
// than asserting a predicate, nothing outside this file needs the bare
// descriptor — every consumer works with `OpenRequest`, which carries the id.
type OpenRequestDescriptor = Extract<Request, { status: 'open' }>;

export type OpenRequest = OpenRequestDescriptor & { requestId: string };

export interface WindowManagementState {
  windowId: number | null;
  exportKeysWindowId: number | null;
  // `Partial` because `tsconfig` has `strict` without `noUncheckedIndexedAccess`:
  // indexing a plain `Record<string, Request>` yields `Request`, never
  // `Request | undefined`. That made the reducer's existence guards — including
  // "a repeated dapp-controlled requestId must not overwrite a live request nor
  // resurrect a tombstone", the most important invariant in this slice — look
  // like dead code to the compiler, i.e. provably removable by anyone who
  // trusts the declared type. Modelling the lookup honestly is what keeps them.
  requests: Partial<Record<string, Request>>;
}
