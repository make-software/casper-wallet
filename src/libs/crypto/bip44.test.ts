import { Bip44Path } from './__fixtures';
import { getBip44Path } from './bip44';

describe('bip44', () => {
  it('should generate valid bip44 derivation path for casper coin', () => {
    expect(getBip44Path(0)).toBe(Bip44Path.Address0);
    expect(getBip44Path(1)).toBe(Bip44Path.Address1);
  });
});
