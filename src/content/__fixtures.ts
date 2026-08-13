export type Handler = (e: { data: unknown }) => void;

// A synchronous stand-in for MessagePort: `postMessage` delivers straight into
// the peer's `onmessage` and its 'message' listeners. Closing either end of the
// pair stops delivery in both directions.
export class FakePort {
  peer!: FakePort;
  onmessage: Handler | null = null;
  listeners: Handler[] = [];
  closed = false;

  postMessage = (data: unknown) => {
    if (this.closed || this.peer.closed) return;
    this.peer.onmessage?.({ data });
    this.peer.listeners.slice().forEach(cb => cb({ data }));
  };
  addEventListener = (type: string, cb: Handler) => {
    if (type === 'message') this.listeners.push(cb);
  };
  removeEventListener = (type: string, cb: Handler) => {
    this.listeners = this.listeners.filter(l => l !== cb);
  };
  start = () => undefined;
  close = () => {
    this.closed = true;
  };
}

type ScriptTag = { onload?: () => void; setAttribute: jest.Mock };

type FakeWindow = {
  location: { origin: string };
  addEventListener: (type: string, cb: Handler) => void;
  removeEventListener: () => void;
  dispatchEvent: () => boolean;
  postMessage: (data: unknown, origin: string, transfer: FakePort[]) => void;
};

// Installs the `MessageChannel` / `window` / `document` / `CustomEvent` globals
// a content-script module touches at require time under `testEnvironment: 'node'`
// (see index.test.ts and sdk-error-envelope.test.ts for why). Callers differ in
// what `window.postMessage` should do, so `win.postMessage` is left as a no-op
// here — set it on the returned `win` before `require`-ing the module under test.
// `channelRef` is a mutable box (not the channel itself): the `MessageChannel`
// constructor below only runs once the required module calls `new MessageChannel()`,
// which happens after this function has already returned.
export function installFakeDom(origin: string) {
  const messageListeners: Handler[] = [];
  const cleanupListeners: (() => void)[] = [];
  const scriptTags: ScriptTag[] = [];
  const channelRef: { current?: { port1: FakePort; port2: FakePort } } = {};

  (global as { MessageChannel?: unknown }).MessageChannel = function () {
    const port1 = new FakePort();
    const port2 = new FakePort();
    port1.peer = port2;
    port2.peer = port1;
    channelRef.current = { port1, port2 };
    return channelRef.current;
  };

  const win: FakeWindow = {
    location: { origin },
    addEventListener: (type: string, cb: Handler) => {
      if (type === 'message') messageListeners.push(cb);
      else cleanupListeners.push(cb as unknown as () => void);
    },
    removeEventListener: () => undefined,
    dispatchEvent: () => true,
    postMessage: () => undefined
  };
  const doc = {
    head: {
      children: [{}],
      insertBefore: () => undefined,
      removeChild: () => undefined
    },
    createElement: () => {
      const tag = { setAttribute: jest.fn() } as ScriptTag;
      scriptTags.push(tag);
      return tag;
    }
  };

  (global as { window?: unknown }).window = win;
  (global as { document?: unknown }).document = doc;
  (global as { CustomEvent?: unknown }).CustomEvent = class {
    constructor(
      public type: string,
      public init?: unknown
    ) {}
  };

  return {
    channelRef,
    scriptTags,
    messageListeners,
    cleanupListeners,
    win,
    doc
  };
}
