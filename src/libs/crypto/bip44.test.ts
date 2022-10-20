import { getBip44Path } from './bip44';

describe('bip44', () => {
  it('should generate valid bip44 derivation path for casper coin', () => {
    expect(getBip44Path(0)).toBe("m/44'/506'/0'/0/0");
    expect(getBip44Path(1)).toBe("m/44'/506'/0'/0/1");
  });
});
