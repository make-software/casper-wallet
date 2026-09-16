/**
 * SHA-256 of `src/assets/wasm/proxy_caller.wasm`; core refuses to build a swap on a mismatch.
 * The bytes run as session code with access to the user's main purse and both the wallet UI and
 * the Ledger prompt show only "ModuleBytes", so replacing either file or hash is a trust decision.
 * Bytes came from the cspr.trade web app's own proxy_caller.wasm; record any new source here.
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
 * The proxy-caller session code every swap, wrap and unwrap carries. The import is eager so the
 * bytes ship in each entry: the background entry is a service worker, with no document for a chunk.
 */
export const getProxyWasm = (): Promise<Uint8Array> =>
  import(/* webpackMode: "eager" */ '@src/assets/wasm/proxy_caller.wasm').then(
    module => base64ToBytes(module.default)
  );
