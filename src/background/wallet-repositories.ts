import { setupRepositories } from 'casper-wallet-core';

const {
  deploysRepository,
  accountInfoRepository,
  tokensRepository,
  nftsRepository,
  validatorsRepository,
  onRampRepository,
  appEventsRepository
} = setupRepositories();

export {
  deploysRepository,
  accountInfoRepository,
  tokensRepository,
  nftsRepository,
  validatorsRepository,
  onRampRepository,
  appEventsRepository
};
