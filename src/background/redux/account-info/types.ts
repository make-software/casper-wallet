import { NFTTokenResult } from '@libs/services/nft-service';

export interface AccountInfoState {
  pendingDeployHashes: string[];
  accountNftTokens: NFTTokenResult[] | null;
  nftTokensCount: number;
  accountTrackingIdOfSentNftTokens: Record<string, string>;
}
