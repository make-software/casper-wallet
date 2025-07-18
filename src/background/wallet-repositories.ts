import { setupRepositories } from 'casper-wallet-core';

const {
  deploysRepository,
  accountInfoRepository,
  tokensRepository,
  nftsRepository,
  validatorsRepository,
  onRampRepository,
  appEventsRepository,
  txSignatureRequestRepository,
  contractPackageRepository
} = setupRepositories();

export {
  deploysRepository,
  accountInfoRepository,
  tokensRepository,
  nftsRepository,
  validatorsRepository,
  onRampRepository,
  appEventsRepository,
  txSignatureRequestRepository,
  contractPackageRepository
};
