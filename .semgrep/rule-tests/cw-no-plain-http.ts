// @ts-nocheck — semgrep pattern fixture, not type-checked code.
// Test fixture for cw-no-plain-http.

// ruleid: cw-no-plain-http
const api = 'http://api.example.com/v1';

// ruleid: cw-no-plain-http
const node = 'http://node.cspr.live/rpc';

// ok: cw-no-plain-http
const devServer = 'http://localhost:8000';

// ok: cw-no-plain-http
const devtools = 'http://127.0.0.1:8001';

// ok: cw-no-plain-http
const svgNs = 'http://www.w3.org/2000/svg';

// ok: cw-no-plain-http
const secureApi = 'https://api.example.com/v1';

export { api, node, devServer, devtools, svgNs, secureApi };
