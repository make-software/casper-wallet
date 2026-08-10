// Toggled per test through the `@src/utils` getter mock below.
let mockIsChromeBuild = true;

const mockGetPlatformInfo = jest.fn();

jest.mock('@src/utils', () => ({
  get isChromeBuild() {
    return mockIsChromeBuild;
  }
}));

jest.mock('webextension-polyfill', () => ({
  runtime: {
    getPlatformInfo: (...args: unknown[]) => mockGetPlatformInfo(...args)
  }
}));

type AnchorModule = typeof import('./sw-keep-alive-anchor');

// The module keeps cold-start/refcount state at module level (re-evaluated on
// every real SW start), so each test loads a fresh copy via resetModules.
const loadAnchorModule = (): AnchorModule => {
  let module: AnchorModule;
  jest.isolateModules(() => {
    module = jest.requireActual('./sw-keep-alive-anchor');
  });
  return module!;
};

describe('anchorServiceWorker', () => {
  let debugSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    mockIsChromeBuild = true;
    mockGetPlatformInfo.mockReset().mockResolvedValue({});
    debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('is a no-op on non-Chrome builds: no breadcrumb, no heartbeat, safe disposer', () => {
    mockIsChromeBuild = false;
    const { anchorServiceWorker, ANCHOR_HEARTBEAT_INTERVAL } =
      loadAnchorModule();

    const release = anchorServiceWorker('unlock');
    jest.advanceTimersByTime(ANCHOR_HEARTBEAT_INTERVAL * 3);

    expect(debugSpy).not.toHaveBeenCalled();
    expect(mockGetPlatformInfo).not.toHaveBeenCalled();
    expect(() => release()).not.toThrow();
  });

  it('logs the cold-start breadcrumb only for the first anchored flow after SW start', () => {
    const { anchorServiceWorker } = loadAnchorModule();

    const releaseFirst = anchorServiceWorker('unlock');
    releaseFirst();
    const releaseSecond = anchorServiceWorker('encrypt');
    releaseSecond();

    expect(debugSpy).toHaveBeenCalledTimes(1);
    expect(debugSpy).toHaveBeenCalledWith('[keepalive] SW resumed mid-unlock');
  });

  it('fires the extension-API heartbeat every interval while held and stops after release', () => {
    const { anchorServiceWorker, ANCHOR_HEARTBEAT_INTERVAL } =
      loadAnchorModule();

    const release = anchorServiceWorker('encrypt');

    jest.advanceTimersByTime(ANCHOR_HEARTBEAT_INTERVAL - 1);
    expect(mockGetPlatformInfo).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(mockGetPlatformInfo).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(ANCHOR_HEARTBEAT_INTERVAL);
    expect(mockGetPlatformInfo).toHaveBeenCalledTimes(2);

    release();

    jest.advanceTimersByTime(ANCHOR_HEARTBEAT_INTERVAL * 3);
    expect(mockGetPlatformInfo).toHaveBeenCalledTimes(2);
  });

  it('refcounts overlapping anchors: one shared interval, kept alive until the last release', () => {
    const { anchorServiceWorker, ANCHOR_HEARTBEAT_INTERVAL } =
      loadAnchorModule();

    const releaseA = anchorServiceWorker('unlock');
    const releaseB = anchorServiceWorker('encrypt');

    // Shared interval: one heartbeat per tick, not one per anchor.
    jest.advanceTimersByTime(ANCHOR_HEARTBEAT_INTERVAL);
    expect(mockGetPlatformInfo).toHaveBeenCalledTimes(1);

    releaseA();

    // B still holds the anchor — heartbeat keeps firing.
    jest.advanceTimersByTime(ANCHOR_HEARTBEAT_INTERVAL);
    expect(mockGetPlatformInfo).toHaveBeenCalledTimes(2);

    releaseB();

    jest.advanceTimersByTime(ANCHOR_HEARTBEAT_INTERVAL * 3);
    expect(mockGetPlatformInfo).toHaveBeenCalledTimes(2);
  });

  it('disposers are idempotent: double-release must not steal another anchor holder', () => {
    const { anchorServiceWorker, ANCHOR_HEARTBEAT_INTERVAL } =
      loadAnchorModule();

    const releaseA = anchorServiceWorker('unlock');
    const releaseB = anchorServiceWorker('create-account');

    releaseA();
    releaseA(); // must not decrement B's hold

    jest.advanceTimersByTime(ANCHOR_HEARTBEAT_INTERVAL);
    expect(mockGetPlatformInfo).toHaveBeenCalledTimes(1);

    releaseB();

    jest.advanceTimersByTime(ANCHOR_HEARTBEAT_INTERVAL * 3);
    expect(mockGetPlatformInfo).toHaveBeenCalledTimes(1);
  });

  it('restarts the heartbeat when a new anchor is taken after full release', () => {
    const { anchorServiceWorker, ANCHOR_HEARTBEAT_INTERVAL } =
      loadAnchorModule();

    anchorServiceWorker('unlock')();

    const release = anchorServiceWorker('encrypt');
    jest.advanceTimersByTime(ANCHOR_HEARTBEAT_INTERVAL);
    expect(mockGetPlatformInfo).toHaveBeenCalledTimes(1);
    release();
  });

  it('swallows heartbeat API rejections (the call itself is the keep-alive)', async () => {
    mockGetPlatformInfo.mockRejectedValue(new Error('boom'));
    const { anchorServiceWorker, ANCHOR_HEARTBEAT_INTERVAL } =
      loadAnchorModule();

    const release = anchorServiceWorker('unlock');
    jest.advanceTimersByTime(ANCHOR_HEARTBEAT_INTERVAL);

    // Flush the rejected promise; an unhandled rejection would fail the test.
    await Promise.resolve();
    await Promise.resolve();

    expect(mockGetPlatformInfo).toHaveBeenCalledTimes(1);
    release();
  });
});
