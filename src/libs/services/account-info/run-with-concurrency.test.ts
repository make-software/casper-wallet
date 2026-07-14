import { runWithConcurrency } from './run-with-concurrency';

describe('runWithConcurrency', () => {
  it('returns [] for empty input', async () => {
    const result = await runWithConcurrency([], 5, async x => x);
    expect(result).toEqual([]);
  });

  it('preserves input order', async () => {
    const result = await runWithConcurrency([1, 2, 3, 4], 2, async n => n * 10);
    expect(result).toEqual([10, 20, 30, 40]);
  });

  it('never exceeds the concurrency limit', async () => {
    let active = 0;
    let peak = 0;
    const worker = async (n: number) => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise(r => setTimeout(r, 5));
      active -= 1;
      return n;
    };
    await runWithConcurrency([1, 2, 3, 4, 5, 6, 7], 3, worker);
    expect(peak).toBeLessThanOrEqual(3);
  });

  it('caps workers at the item count when limit exceeds it', async () => {
    let peak = 0;
    let active = 0;
    const worker = async (n: number) => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise(r => setTimeout(r, 1));
      active -= 1;
      return n;
    };
    await runWithConcurrency([1, 2], 5, worker);
    expect(peak).toBeLessThanOrEqual(2);
  });
});
