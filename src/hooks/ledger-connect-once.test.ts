import { connectLedgerOnce } from './ledger-connect-once';

const deferred = () => {
  let resolve: () => void = () => {};
  let reject: (reason: Error) => void = () => {};
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

// WALLET-1452: two attempts leave two pollers on the one transport, and the
// survivor's poll fails the signature exchange as a race.
it('joins an attempt that is already in flight', async () => {
  const first = deferred();
  const connect = jest.fn(() => first.promise);

  const joined = Promise.all([
    connectLedgerOnce(connect),
    connectLedgerOnce(connect)
  ]);

  expect(connect).toHaveBeenCalledTimes(1);

  first.resolve();
  await joined;
});

it('starts a fresh attempt once the previous one resolved', async () => {
  const connect = jest.fn(() => Promise.resolve());

  await connectLedgerOnce(connect);
  await connectLedgerOnce(connect);

  expect(connect).toHaveBeenCalledTimes(2);
});

it('starts a fresh attempt once the previous one failed', async () => {
  const connect = jest.fn(() => Promise.reject(new Error('no device')));

  await expect(connectLedgerOnce(connect)).rejects.toThrow('no device');
  await expect(connectLedgerOnce(connect)).rejects.toThrow('no device');

  expect(connect).toHaveBeenCalledTimes(2);
});

it('fails every joined caller when the attempt fails', async () => {
  const first = deferred();
  const connect = jest.fn(() => first.promise);

  const joined = [connectLedgerOnce(connect), connectLedgerOnce(connect)];

  first.reject(new Error('no device'));

  await expect(joined[0]).rejects.toThrow('no device');
  await expect(joined[1]).rejects.toThrow('no device');
  expect(connect).toHaveBeenCalledTimes(1);
});
