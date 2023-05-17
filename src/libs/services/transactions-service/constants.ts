export const getDeployHashLink = (deployHash: string, casperLiveUrl: string) =>
  `${casperLiveUrl}/deploy/${deployHash}`;

export const getAccountTransfersLink = (
  accountHash: string,
  casperApiUrl: string,
  page: number
) =>
  `${casperApiUrl}/accounts/${accountHash}/transfers?page=${page}&limit=10&with_extended_info=1&with_amounts_in_currency_id=1`;
