import { AccountInfo } from '@libs/services/account-info';

export const getAccountInfoLogo = (
  accountInfo: AccountInfo | null | undefined
): string | null => {
  if (!accountInfo) return null;

  const logo = accountInfo.info?.owner?.branding?.logo;

  if (logo?.svg) {
    return logo?.svg;
  }

  if (logo?.png_256) {
    return logo?.png_256;
  }

  return null;
};
