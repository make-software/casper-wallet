import { setupDataRepositories } from 'casper-wallet-core/src/setupData';

/**
 * The repositories every surface reads from. Imported by path, and deliberately not
 * `setupRepositories` from the package root: that factory also builds the transaction-signature
 * and EIP-712 repositories, which link `casper-js-sdk` — a single prebuilt UMD bundle, so one
 * import costs ~900 KB that no bundler can shake back out, on every page that renders a balance.
 *
 * The two signing repositories live in `./signing-repositories`, which only the signing surfaces
 * import.
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
  // Shared with `./signing-repositories` so both halves talk through one provider and one logger.
  httpDataProvider,
  log
};
