// Assigns webpack's magic __webpack_nonce__ so style-loader stamps its injected
// <style> tags with the build-time CSP nonce (Chrome prod style-src is
// 'self' 'nonce-<value>' with no 'unsafe-inline'). Must be imported FIRST in every
// app entry, before any style-loader CSS import or styled-components injection runs.
declare let __webpack_nonce__: string;
// Ambient webpack global: style-loader's runtime reads it off the global scope (not
// from this module), so ESLint can't see the "use", and it must stay `let` since it's
// assigned after declaration rather than initialized inline.
// eslint-disable-next-line prefer-const, @typescript-eslint/no-unused-vars
__webpack_nonce__ = process.env.CSP_NONCE as string;
