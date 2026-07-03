import { getValidatorListHeight } from './get-validator-list-height';

describe('getValidatorListHeight', () => {
  it('caps at 3 rows of 80px when there are more than 3 validators', () => {
    expect(getValidatorListHeight(10)).toBe(240);
  });

  it('caps at 3 rows of 80px exactly at 3 validators', () => {
    expect(getValidatorListHeight(3)).toBe(240);
  });

  it('shrinks to fit when there are fewer than 3 validators', () => {
    expect(getValidatorListHeight(1)).toBe(80);
    expect(getValidatorListHeight(2)).toBe(160);
  });

  it('returns 0 for an empty list', () => {
    expect(getValidatorListHeight(0)).toBe(0);
  });
});
