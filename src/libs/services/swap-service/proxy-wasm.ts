/**
 * SHA-256 of `src/assets/wasm/proxy_caller.wasm`, `shasum -a 256`.
 *
 * `casper-wallet-core` verifies the loaded bytes against this once and refuses to build a swap
 * on a mismatch. The check is worth having because the bytes run as session code in the user's
 * account context with access to their main purse, and both the wallet UI and the Ledger prompt
 * show only "ModuleBytes".
 */
export const PROXY_CALLER_WASM_SHA256 =
  '6f25e7a3098d8301a36327ec17e70570004f30985e3682d61bd849ee4c24548d';

/** Decodes what the `base64-loader` webpack rule hands back for a `.wasm` import. */
export const base64ToBytes = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
};

/**
 * The proxy-caller session code every swap, wrap and unwrap transaction carries.
 *
 * Loaded through a dynamic import so the ~70 KB of base64 lands in its own chunk: this module is
 * reached from `signing-repositories`, which every page that sends anything imports.
 */
export const getProxyWasm = (): Promise<Uint8Array> =>
  import('@src/assets/wasm/proxy_caller.wasm').then(module =>
    base64ToBytes(module.default)
  );
