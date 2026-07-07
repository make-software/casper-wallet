export type KeysState = {
  passwordHash: string | null;
  passwordSaltHash: string | null;
  keyDerivationSaltHash: string | null;
  /** P0.1: public existence flag — the only keys fact the popup replica receives */
  keysDoesExist: boolean;
};
