import { AccountInfo } from '@libs/services/account-info';

export const getAccountInfo = (accountInfo?: AccountInfo) => {
  return {
    logo: accountInfo?.info?.owner?.branding?.logo,
    accountName: accountInfo?.info?.owner?.name,
    accountHash: accountInfo?.account_hash
  };
};

export const getAccountInfoLogo = (
  accountInfo: AccountInfo | null | undefined
): string | null => {
  if (!accountInfo) return null;

  const { logo } = getAccountInfo(accountInfo);

  if (logo?.svg) {
    return logo?.svg;
  }

  if (logo?.png_256) {
    return logo?.png_256;
  }

  return null;
};
