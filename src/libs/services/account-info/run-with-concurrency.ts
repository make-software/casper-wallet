export async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  const runNext = async (): Promise<void> => {
    const current = nextIndex;
    nextIndex += 1;
    if (current >= items.length) {
      return;
    }
    results[current] = await worker(items[current]);
    await runNext();
  };

  const workerCount = Math.min(Math.max(limit, 1), items.length);
  await Promise.all(Array.from({ length: workerCount }, () => runNext()));

  return results;
}
