import { chunkArray } from './utils';

describe('chunkArray', () => {
  it('returns an empty array for empty input', () => {
    expect(chunkArray([], 5)).toEqual([]);
  });

  it('splits an exact multiple into equal chunks', () => {
    expect(chunkArray([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4]
    ]);
  });

  it('puts the remainder into the last chunk', () => {
    expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('returns a single chunk when size exceeds the array length', () => {
    expect(chunkArray([1, 2], 5)).toEqual([[1, 2]]);
  });
});
