export enum NamedKeyPrefix {
  HASH = 'hash-',
  CONTRACT = 'contract-',
  UREF = 'uref-',
  DEPLOY = 'deploy-',
  ERA_INFO_PREFIX = 'era-',
  BALANCE_PREFIX = 'balance-',
  BID_PREFIX = 'bid-',
  WITHDRAW_PREFIX = 'withdraw-',
  DICTIONARY_PREFIX = 'dictionary-',
  ACCOUNT_HASH = 'account-hash-',
  CONTRACT_PACKAGE = 'contract-package-'
}

export const hashPrefixRegEx = new RegExp(
  `(${Object.values(NamedKeyPrefix).join('|')})(?=[0-9a-fA-F])`,
  'i'
);

export const hasNamedKeyPrefix = (value: any): boolean =>
  typeof value === 'string' &&
  Object.values(NamedKeyPrefix).some(prefix => (value || '').includes(prefix));

export const getNamedKeyPrefix = (value: string): string => {
  const hasPrefix = hasNamedKeyPrefix(value);

  return hasPrefix && value.match(hashPrefixRegEx)
    ? value.match(hashPrefixRegEx)![0]
    : '';
};
