import { setupRepositories } from 'casper-wallet-core';

const { deploysRepository, accountInfoRepository } = setupRepositories();

export { deploysRepository, accountInfoRepository };
