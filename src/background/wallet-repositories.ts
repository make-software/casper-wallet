import { setupRepositories } from 'casper-wallet-core';

// TODO only deploysRepository usage for HRD. Other stuff later
const { deploysRepository } = setupRepositories();

export { deploysRepository };
