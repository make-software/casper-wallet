export interface SessionState {
  encryptionKeyHash: string | null;
  /** The only session-secret fact the popup replica receives. */
  encryptionKeyDoesExist: boolean;
  isLocked: boolean;
  isContactEditingAllowed: boolean;
}
