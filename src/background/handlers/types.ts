// A handler THROWs to signal sendError; `{ handled: false }` falls through to
// the next handler, and `response`, when present, is passed to sendResponse.
export type HandlerResult =
  { handled: false } | { handled: true; response?: unknown };
