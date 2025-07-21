export type TrustedWasmState = {
  /** {origin: wasmHashes[]} */
  hashesByOriginDict: Record<string, string[]>;
};
