export interface SessionState {
  encryptionKeyHash: string | null;
  /** P0.1: public existence flag — the only session-secret fact the popup replica receives */
  encryptionKeyDoesExist: boolean;
  isLocked: boolean;
  isContactEditingAllowed: boolean;
}
