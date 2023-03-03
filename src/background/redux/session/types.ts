export interface SessionState {
  encryptionKeyHash: string | null;
  isLocked: boolean;
  activeOrigin: string | null;
}
