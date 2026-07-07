// Shared result convention for all background message handlers:
//   { handled: false }                    → try the next handler
//   { handled: true }                     → handled, DO NOT respond (promise
//                                            stays pending — preserves current
//                                            popupStateUpdated / bringweb3-noise
//                                            no-response behavior)
//   { handled: true, response: <value> }  → handled, sendResponse(value)
// Handlers THROW to signal sendError (preserves the previous
// `return sendError(...)` semantics).
export type HandlerResult =
  { handled: false } | { handled: true; response?: unknown };
