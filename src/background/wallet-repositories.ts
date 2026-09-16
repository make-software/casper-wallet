import { setupDataRepositories } from 'casper-wallet-core/src/setupData';

/**
 * The repositories every surface reads from. Imported by path, and deliberately not
 * `setupRepositories` from the package root: that factory also builds the signing
 * repositories, which link `casper-js-sdk` — ~900 KB no bundler can shake back out.
 */
const {
  deploysRepository,
  accountInfoRepository,
  tokensRepository,
  nftsRepository,
  validatorsRepository,
  onRampRepository,
  appEventsRepository,
  contractPackageRepository,
  swapRepository,
  httpDataProvider,
  log
} = setupDataRepositories();

export {
  deploysRepository,
  accountInfoRepository,
  tokensRepository,
  nftsRepository,
  validatorsRepository,
  onRampRepository,
  appEventsRepository,
  contractPackageRepository,
  swapRepository,
  // Shared with `./signing-repositories` so both halves talk through one provider and one logger.
  httpDataProvider,
  log
};
