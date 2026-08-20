// jest substitute for spawn-scrypt-worker.ts — see the note there. Nothing under
// jest reaches the offload branch (`Worker` is undefined in the node
// environment), so this only has to exist, not work.
export const spawnScryptWorker = (): Worker => {
  throw Error('spawnScryptWorker is not available under test');
};
