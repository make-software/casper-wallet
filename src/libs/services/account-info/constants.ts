import { getCasperApiUrl } from '@src/constants';

export const getAccountInfoUrl = ({
  accountHash
}: {
  accountHash: string;
}): string => `${getCasperApiUrl()}/accounts-info/${accountHash}`;

export const ACCOUNTS_INFO_URL = `${getCasperApiUrl()}/accounts-info`;
