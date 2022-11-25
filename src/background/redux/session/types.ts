export interface SessionState {
  encryptionKeyHash: string | null;
  isLocked: boolean;
  lastActivityTime: number | null;
  activeOrigin: string | null;
}
