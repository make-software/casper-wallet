import { CasperWalletApiByEnvUrl } from 'casper-wallet-core/src/domain/constants/casperNetwork';
import { setupSigningRepositories } from 'casper-wallet-core/src/setupSigning';

import {
  accountInfoRepository,
  contractPackageRepository,
  httpDataProvider,
  log,
  tokensRepository
} from '@background/wallet-repositories';

/**
 * The repositories that parse and sign transactions.
 *
 * Importing this module links `casper-js-sdk` (~900 KB, one prebuilt UMD bundle with nothing to
 * shake out), so it is kept out of `./wallet-repositories`: every page entry reads balances and
 * accounts, but only the signing surfaces and the background need these two.
 */
const { txSignatureRequestRepository, eip712Repository } =
  setupSigningRepositories({
    httpDataProvider,
    accountInfoRepository,
    tokensRepository,
    contractPackageRepository,
    casperWalletApiByEnvUrl: CasperWalletApiByEnvUrl,
    log
  });

export { txSignatureRequestRepository, eip712Repository };
