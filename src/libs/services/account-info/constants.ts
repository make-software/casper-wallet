import { BASE_URL_TESTNET } from '@src/constants';

export const getAccountInfoUrl = ({
  accountHash
}: {
  accountHash: string;
}): string => `${BASE_URL_TESTNET}/accounts-info/${accountHash}`;

export const ACCOUNTS_INFO_URL = `${BASE_URL_TESTNET}/accounts-info`;
