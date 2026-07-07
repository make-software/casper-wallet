export type RequestStatus = 'open' | 'responded' | 'closed';

export interface WindowManagementState {
  windowId: number | null;
  requests: Record<string, RequestStatus>;
}
