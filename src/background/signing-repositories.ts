import { CasperWalletApiByEnvUrl } from 'casper-wallet-core/src/domain/constants/casperNetwork';
import { setupSigningRepositories } from 'casper-wallet-core/src/setupSigning';

import {
  accountInfoRepository,
  contractPackageRepository,
  httpDataProvider,
  log,
  tokensRepository
} from '@background/wallet-repositories';

import {
  PROXY_CALLER_WASM_SHA256,
  getProxyWasm
} from '@libs/services/swap-service/proxy-wasm';

/**
 * The repositories that parse and sign transactions.
 *
 * Kept out of `./wallet-repositories` because importing this module links
 * `casper-js-sdk` (~900 KB, nothing to shake out); only signing surfaces need it.
 */
const {
  txSignatureRequestRepository,
  eip712Repository,
  casperTransactionsRepository,
  dexContractRepository,
  transactionStatusRepository
} = setupSigningRepositories({
  httpDataProvider,
  accountInfoRepository,
  tokensRepository,
  contractPackageRepository,
  casperWalletApiByEnvUrl: CasperWalletApiByEnvUrl,
  // Without this the DEX repository builds approvals and nothing else — the swap, wrap and
  // unwrap builders all need the proxy bytes.
  dexConfig: {
    getProxyWasm,
    expectedProxyWasmSha256: PROXY_CALLER_WASM_SHA256
  },
  log
});

export {
  txSignatureRequestRepository,
  eip712Repository,
  casperTransactionsRepository,
  dexContractRepository,
  transactionStatusRepository
};
