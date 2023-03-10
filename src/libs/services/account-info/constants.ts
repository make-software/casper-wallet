export const getAccountInfoUrl = ({
  accountHash,
  casperApiUrl
}: {
  accountHash: string;
  casperApiUrl: string;
}): string => `${casperApiUrl}/accounts-info/${accountHash}`;

export const getAccountsInfoUrl = (casperApiUrl: string) =>
  `${casperApiUrl}/accounts-info`;
