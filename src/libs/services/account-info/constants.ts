export const getAccountInfoUrl = ({
  accountHash,
  casperClarityApiUrl
}: {
  accountHash: string;
  casperClarityApiUrl: string;
}): string => `${casperClarityApiUrl}/accounts-info/${accountHash}`;
