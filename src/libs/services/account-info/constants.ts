export const getAccountInfoUrl = ({
  accountHash,
  casperApiUrl
}: {
  accountHash: string;
  casperApiUrl: string;
}): string => `${casperApiUrl}/accounts-info/${accountHash}`;
