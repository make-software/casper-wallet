import { setupSigningRepositories } from 'casper-wallet-core/src/setupSigning';

import {
  casperTransactionsRepository,
  dexContractRepository,
  transactionStatusRepository
} from '@background/signing-repositories';

import { PROXY_CALLER_WASM_SHA256 } from '@libs/services/swap-service/proxy-wasm';

// The stubs are built inside the factory: the module under test runs `setupSigningRepositories`
// at import time, before any top-level const in this file is initialized.
jest.mock('casper-wallet-core/src/setupSigning', () => ({
  setupSigningRepositories: jest.fn(() => ({
    txSignatureRequestRepository: { name: 'txSignatureRequest' },
    eip712Repository: { name: 'eip712' },
    dexContractRepository: { name: 'dexContract' },
    casperTransactionsRepository: { name: 'casperTransactions' },
    transactionStatusRepository: { name: 'transactionStatus' }
  }))
}));

const setupMock = setupSigningRepositories as jest.Mock;
const setupArgs = () => setupMock.mock.calls[0][0];
const builtRepositories = () => setupMock.mock.results[0].value;

describe('signing-repositories', () => {
  it('re-exports the repositories core built, not substitutes', () => {
    const built = builtRepositories();

    expect(dexContractRepository).toBe(built.dexContractRepository);
    expect(casperTransactionsRepository).toBe(
      built.casperTransactionsRepository
    );
    expect(transactionStatusRepository).toBe(built.transactionStatusRepository);
  });

  // Core reads this as `if (expectedProxyWasmSha256) { … }` and skips WASM verification when it
  // is absent, so a swap would still sign unverified session code with no visible symptom.
  it('arms core’s WASM check with the hash the vendored bytes are pinned to', () => {
    expect(setupArgs().dexConfig.expectedProxyWasmSha256).toBe(
      PROXY_CALLER_WASM_SHA256
    );
  });

  it('supplies the loader those bytes come from', () => {
    expect(typeof setupArgs().dexConfig.getProxyWasm).toBe('function');
  });
});
