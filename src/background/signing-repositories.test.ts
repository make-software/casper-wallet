import {
  dexContractRepository,
  transactionStatusRepository
} from '@background/signing-repositories';

describe('signing-repositories', () => {
  it('wires the DEX and transaction-status repositories', () => {
    expect(dexContractRepository).toBeDefined();
    expect(transactionStatusRepository).toBeDefined();
  });
});
