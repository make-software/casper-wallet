export type SdkError = {
  message: string;
  code: number;
};

const createAppError = (message: string, code: number): SdkError => {
  return {
    message,
    code
  };
};

export const WalletLockedError = () => createAppError('Wallet is locked.', 1);

export const SiteNotConnectedError = () =>
  createAppError('Active account not approved to connect with the site.', 2);
