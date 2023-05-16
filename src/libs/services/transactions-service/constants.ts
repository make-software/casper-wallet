export const getDeployHashLink = (deployHash: string, casperLiveUrl: string) =>
  `${casperLiveUrl}/deploy/${deployHash}`;

export const getAccountTransfersLink = (
  accountHash: string,
  casperApiUrl: string
) =>
  `${casperApiUrl}/accounts/${accountHash}/transfers?page=1&limit=10&with_extended_info=1&with_amounts_in_currency_id=1`;
