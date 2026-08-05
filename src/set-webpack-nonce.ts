// Assigns webpack's magic __webpack_nonce__ so style-loader stamps its injected
// <style> tags with the build-time CSP nonce (Chrome prod style-src is
// 'self' 'nonce-<value>' with no 'unsafe-inline'). Must be imported FIRST in every
// app entry, before any style-loader CSS import or styled-components injection runs.
declare let __webpack_nonce__: string | undefined;

// __CSP_NONCE__ is a real string only on Chrome production; elsewhere it is null
// and style-src keeps 'unsafe-inline'. style-loader already refuses to stamp a
// falsy nonce on its own (dist/runtime/setAttributes*.js), so this guard is not
// what prevents a `nonce="null"` attribute. What it does carry: it leaves
// __webpack_require__.nc unset on non-Chrome targets, and it keeps the
// `string | undefined` declaration above honest — assigning a `string | null`
// to it would not type-check.
if (__CSP_NONCE__) {
  // Ambient webpack global: style-loader's runtime reads it off the global scope,
  // not from this module, so ESLint cannot see the "use".
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  __webpack_nonce__ = __CSP_NONCE__;
}

// Keeps this file a module. Without it TypeScript treats it as a global script and
// every top-level binding here leaks into the project-wide scope, where `tsc` would
// accept a bare reference from any other file that webpack then fails to resolve.
export {};
