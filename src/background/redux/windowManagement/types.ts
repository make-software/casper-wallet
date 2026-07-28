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
export type Request =
  | {
      status: 'open';
      tabId: number;
      origin: string;
      method: CancellableMethod;
      windowIds: number[];
    }
  | { status: 'responded' };

export type OpenRequestDescriptor = Extract<Request, { status: 'open' }>;

export type OpenRequest = OpenRequestDescriptor & { requestId: string };

export interface WindowManagementState {
  windowId: number | null;
  exportKeysWindowId: number | null;
  requests: Record<string, Request>;
}
