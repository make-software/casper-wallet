import { TransferType } from '@libs/ui';

export type LocationState = {
  showNavigationMenu?: boolean;
  activityDetailsData?: {
    fromAccountPublicKey?: string;
    toAccountPublicKey?: string;
    deployHash?: string;
    type?: TransferType | null;
  };
};
