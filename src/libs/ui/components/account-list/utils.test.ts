import { sortAccounts } from './utils';

describe('sortAccount()', () => {
  const accounts = [
    {
      name: 'Test user 1',
      publicKey:
        '02026360f7ea7ce2ab573c732252e166bff086fe69d5d892b31f22fb80d910bde63b',
      secretKey: 'FXYT1tqA5j89+P4Aw/VMDRZSrH5byyBvcan2CRLMnEE=',
      hidden: false
    },
    {
      name: 'Test user 2',
      publicKey:
        '01f9631111f51219ac0b96ce69ffd9f8fc274a744a8e3e77cd7b18f8b5d4bcf39a',
      secretKey: '0Z4EkL1TStnELE1QL2IgtjiOem3mjMp4WHOX91Er6Lc=',
      hidden: false
    },
    {
      name: 'Test user 3',
      publicKey:
        '020373098cf279f55b501a16642e18ecfe4691ce795213060f28c86bf485f16528da',
      secretKey: 'nWbsCkonqeWOeT1S9clhyFlb5HfN5blktdZbJCmK5qE=',
      hidden: false
    },
    {
      name: 'Test user 4',
      publicKey:
        '01d302c4a8e9687f0ed0ffa5f9cd29cb5109af526cd72da5a0db9c321fc990bee0',
      secretKey: '09+B7ceHs72J8YdNxCPzxuo3g6MJPTVZcr30PiSZoPE=',
      hidden: false
    },
    {
      name: 'Test user 5',
      publicKey:
        '01f33224e945e601fec597b711abe1966abeddb41881954d281c99634df2698a7b',
      secretKey: 'KrwMFnKWZ4ASavxhzJ59g/+6KkZHXatLl6G3DzJ6uLA=',
      hidden: false
    }
  ];

  const connectedAccountNames = ['Test user 1', 'Test user 3', 'Test user 5'];
  const activeAccountName = 'Test user 3';

  const expected = [
    {
      name: 'Test user 3',
      publicKey:
        '020373098cf279f55b501a16642e18ecfe4691ce795213060f28c86bf485f16528da',
      secretKey: 'nWbsCkonqeWOeT1S9clhyFlb5HfN5blktdZbJCmK5qE=',
      hidden: false
    },
    {
      name: 'Test user 1',
      publicKey:
        '02026360f7ea7ce2ab573c732252e166bff086fe69d5d892b31f22fb80d910bde63b',
      secretKey: 'FXYT1tqA5j89+P4Aw/VMDRZSrH5byyBvcan2CRLMnEE=',
      hidden: false
    },
    {
      name: 'Test user 5',
      publicKey:
        '01f33224e945e601fec597b711abe1966abeddb41881954d281c99634df2698a7b',
      secretKey: 'KrwMFnKWZ4ASavxhzJ59g/+6KkZHXatLl6G3DzJ6uLA=',
      hidden: false
    },
    {
      name: 'Test user 2',
      publicKey:
        '01f9631111f51219ac0b96ce69ffd9f8fc274a744a8e3e77cd7b18f8b5d4bcf39a',
      secretKey: '0Z4EkL1TStnELE1QL2IgtjiOem3mjMp4WHOX91Er6Lc=',
      hidden: false
    },
    {
      name: 'Test user 4',
      publicKey:
        '01d302c4a8e9687f0ed0ffa5f9cd29cb5109af526cd72da5a0db9c321fc990bee0',
      secretKey: '09+B7ceHs72J8YdNxCPzxuo3g6MJPTVZcr30PiSZoPE=',
      hidden: false
    }
  ];

  it('should return sorted array of accounts in order: active account first, connected accounts second then all the rest keeping the same order', () => {
    expect(
      sortAccounts(accounts, activeAccountName, connectedAccountNames)
    ).toEqual(expected);
  });
});
