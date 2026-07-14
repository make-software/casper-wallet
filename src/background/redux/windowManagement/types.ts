export type RequestStatus = 'open' | 'responded' | 'closed';

export type CancellableMethod =
  | 'connect'
  | 'switchAccount'
  | 'sign'
  | 'signMessage'
  | 'signTypedData'
  | 'decryptMessage';

export interface PendingRequestDescriptor {
  tabId: number;
  origin: string;
  method: CancellableMethod;
}

export interface WindowManagementState {
  windowId: number | null;
  requests: Record<string, RequestStatus>;
  pendingRequests: Record<string, PendingRequestDescriptor>;
}
