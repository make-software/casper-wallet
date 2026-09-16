// Isolated so `import.meta.url` — needed by webpack to emit the worker chunk,
// uncompilable by ts-jest under CommonJS — stays out of modules tests pull in.
export const spawnScryptWorker = (): Worker =>
  new Worker(new URL('./scrypt-worker.ts', import.meta.url));
