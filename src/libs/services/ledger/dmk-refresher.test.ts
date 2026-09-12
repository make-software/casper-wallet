import { RefresherControl, createRefresherGate } from './dmk-refresher';

function createFakeDmk() {
  const releases: jest.Mock<void, []>[] = [];
  const blockerIds: string[] = [];

  const disableDeviceSessionRefresher = jest.fn(
    (args: { sessionId: string; blockerId: string }) => {
      blockerIds.push(args.blockerId);

      const release = jest.fn<void, []>();
      releases.push(release);

      return release;
    }
  );

  const dmk: RefresherControl = { disableDeviceSessionRefresher };

  return { dmk, disableDeviceSessionRefresher, releases, blockerIds };
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

describe('createRefresherGate', () => {
  it('takes a blocker at construction, so the refresher is off while nothing observes', () => {
    const { dmk, disableDeviceSessionRefresher, releases } = createFakeDmk();

    createRefresherGate(dmk, 'session-1');

    expect(disableDeviceSessionRefresher).toHaveBeenCalledTimes(1);
    expect(disableDeviceSessionRefresher).toHaveBeenCalledWith({
      sessionId: 'session-1',
      blockerId: 'unobserved'
    });
    expect(releases[0]).not.toHaveBeenCalled();
  });

  it('releases the standing blocker when the first observer starts', () => {
    const { dmk, disableDeviceSessionRefresher, releases } = createFakeDmk();
    const gate = createRefresherGate(dmk, 'session-1');

    gate.beginObserving();

    expect(releases[0]).toHaveBeenCalledTimes(1);
    expect(disableDeviceSessionRefresher).toHaveBeenCalledTimes(1);
  });

  it('takes a blocker again when the last observer stops', () => {
    const { dmk, disableDeviceSessionRefresher, releases } = createFakeDmk();
    const gate = createRefresherGate(dmk, 'session-1');

    const stopObserving = gate.beginObserving();
    stopObserving();

    expect(disableDeviceSessionRefresher).toHaveBeenCalledTimes(2);
    expect(disableDeviceSessionRefresher).toHaveBeenLastCalledWith({
      sessionId: 'session-1',
      blockerId: 'unobserved'
    });
    expect(releases[1]).not.toHaveBeenCalled();
  });

  it('releases the standing blocker exactly once when a second observer starts', () => {
    const { dmk, disableDeviceSessionRefresher, releases } = createFakeDmk();
    const gate = createRefresherGate(dmk, 'session-1');

    gate.beginObserving();
    gate.beginObserving();

    expect(releases[0]).toHaveBeenCalledTimes(1);
    expect(disableDeviceSessionRefresher).toHaveBeenCalledTimes(1);
  });

  it('keeps the refresher running when one of two observers leaves', () => {
    const { dmk, disableDeviceSessionRefresher } = createFakeDmk();
    const gate = createRefresherGate(dmk, 'session-1');

    const stopFirst = gate.beginObserving();
    gate.beginObserving();
    stopFirst();

    expect(disableDeviceSessionRefresher).toHaveBeenCalledTimes(1);
  });

  it('ignores a release called twice, so the observer count cannot go negative', () => {
    const { dmk, disableDeviceSessionRefresher, releases } = createFakeDmk();
    const gate = createRefresherGate(dmk, 'session-1');

    const stopObserving = gate.beginObserving();
    stopObserving();
    stopObserving();

    expect(disableDeviceSessionRefresher).toHaveBeenCalledTimes(2);

    gate.beginObserving();

    expect(releases[1]).toHaveBeenCalledTimes(1);
    expect(disableDeviceSessionRefresher).toHaveBeenCalledTimes(2);
  });

  it('holds a blocker for exactly the span of an exchange', async () => {
    const { dmk, disableDeviceSessionRefresher, releases, blockerIds } =
      createFakeDmk();
    const gate = createRefresherGate(dmk, 'session-1');
    gate.beginObserving();

    const deferred = createDeferred<string>();
    const exchange = gate.duringExchange(() => deferred.promise);

    expect(disableDeviceSessionRefresher).toHaveBeenCalledTimes(2);
    expect(blockerIds[1]).toBe('exchange');
    expect(releases[1]).not.toHaveBeenCalled();

    deferred.resolve('result');

    await expect(exchange).resolves.toBe('result');
    expect(releases[1]).toHaveBeenCalledTimes(1);
  });

  it('releases the blocker and rethrows when an exchange rejects', async () => {
    const { dmk, releases } = createFakeDmk();
    const gate = createRefresherGate(dmk, 'session-1');
    gate.beginObserving();

    const failure = new Error('APDU failed');

    await expect(
      gate.duringExchange(() => Promise.reject(failure))
    ).rejects.toBe(failure);
    expect(releases[1]).toHaveBeenCalledTimes(1);
  });

  it('refcounts overlapping exchanges', async () => {
    const { dmk, disableDeviceSessionRefresher, releases } = createFakeDmk();
    const gate = createRefresherGate(dmk, 'session-1');
    gate.beginObserving();

    const first = createDeferred<string>();
    const second = createDeferred<string>();

    const firstExchange = gate.duringExchange(() => first.promise);
    const secondExchange = gate.duringExchange(() => second.promise);

    expect(disableDeviceSessionRefresher).toHaveBeenCalledTimes(3);

    second.resolve('second');
    await secondExchange;

    expect(releases[2]).toHaveBeenCalledTimes(1);
    expect(releases[1]).not.toHaveBeenCalled();

    first.resolve('first');
    await firstExchange;

    expect(releases[1]).toHaveBeenCalledTimes(1);
  });

  it('drops every hold on disposal', () => {
    const { dmk, releases } = createFakeDmk();
    const gate = createRefresherGate(dmk, 'session-1');
    gate.beginObserving();
    gate.duringExchange(() => createDeferred<string>().promise);

    gate.dispose();

    expect(releases).toHaveLength(2);
    releases.forEach(release => expect(release).toHaveBeenCalledTimes(1));
  });
});
