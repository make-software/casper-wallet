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
  contractPackageRepository,
  eip712Repository
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
  contractPackageRepository,
  eip712Repository
};
