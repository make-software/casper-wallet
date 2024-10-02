import { setupRepositories } from 'casper-wallet-core';

const { deploysRepository, accountInfoRepository, tokensRepository } =
  setupRepositories();

export { deploysRepository, accountInfoRepository, tokensRepository };
