export type RequestStatus = 'open' | 'responded';

export type CancellableMethod =
  | 'connect'
  | 'switchAccount'
  | 'sign'
  | 'signMessage'
  | 'signTypedData'
  | 'decryptMessage';

// `windowIds` is every window currently DISPLAYING this request; cancellation is
// driven by "this window displays it no longer", never by a timer.
export type Request =
  | {
      readonly status: 'open';
      readonly tabId: number;
      // The frame that made the request: under `all_frames: true` a bare
      // `tabs.sendMessage(tabId, …)` reaches every frame, iframes included.
      readonly frameId?: number;
      readonly origin: string;
      readonly method: CancellableMethod;
      readonly windowIds: readonly number[];
      // A Ledger confirmation is in flight: reusing a window that displays this
      // request navigates away the document holding the HID session.
      readonly awaitingDeviceConfirmation: boolean;
      // Registration order, stamped once. Key order cannot stand in for it: an
      // integer-like id such as `"42"` enumerates ahead of every string key.
      readonly seq: number;
    }
  | {
      readonly status: 'responded';
      // Outlives the descriptor because eviction ranks tombstones by age.
      readonly seq: number;
    };

type OpenRequestDescriptor = Extract<Request, { status: 'open' }>;

export type OpenRequest = OpenRequestDescriptor & { requestId: string };

export interface WindowManagementState {
  windowId: number | null;
  exportKeysWindowId: number | null;
  // `Partial` because without `noUncheckedIndexedAccess` a plain `Record` hides
  // the undefined case, making the reducer's existence guards look like dead code.
  requests: Partial<Record<string, Request>>;
}
