// jest substitute for spawn-scrypt-worker.ts. Nothing under jest reaches the
// offload branch, so this only has to exist, not work.
export const spawnScryptWorker = (): Worker => {
  throw Error('spawnScryptWorker is not available under test');
};
