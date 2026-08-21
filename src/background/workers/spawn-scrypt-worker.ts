// Isolated so that `import.meta.url` — which webpack needs to emit the worker
// chunk, and which ts-jest cannot compile under CommonJS — stays out of every
// module a test pulls in. jest maps this file to spawn-scrypt-worker.stub.ts.
export const spawnScryptWorker = (): Worker =>
  new Worker(new URL('./scrypt-worker.ts', import.meta.url));
