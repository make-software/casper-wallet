// Assigns webpack's magic __webpack_nonce__ so style-loader stamps its injected
// <style> tags with the CSP nonce. Must be imported FIRST in every app entry.
declare let __webpack_nonce__: string | undefined;

// __CSP_NONCE__ is a real string only on Chrome production; the guard leaves
// __webpack_require__.nc unset elsewhere.
if (__CSP_NONCE__) {
  // style-loader reads this off the global scope, so ESLint cannot see the "use".
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  __webpack_nonce__ = __CSP_NONCE__;
}

// Keeps this file a module; otherwise its top-level bindings become global.
export {};
