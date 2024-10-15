import { setupRepositories } from 'casper-wallet-core';

const {
  deploysRepository,
  accountInfoRepository,
  tokensRepository,
  nftsRepository,
  validatorsRepository
} = setupRepositories();

export {
  deploysRepository,
  accountInfoRepository,
  tokensRepository,
  nftsRepository,
  validatorsRepository
};
