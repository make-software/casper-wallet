import { dexContractRepository } from '@background/signing-repositories';
import {
  swapRepository,
  tokensRepository
} from '@background/wallet-repositories';

import { buildSwapDependencies } from '@libs/services/swap-service/use-swap-dependencies';

describe('buildSwapDependencies', () => {
  it('wires the module-singleton repositories through untouched', () => {
    const deps = buildSwapDependencies({
      network: 'mainnet',
      activePublicKey: '0123456789abcdef'
    });

    expect(deps.swapRepository).toBe(swapRepository);
    expect(deps.dexContractRepository).toBe(dexContractRepository);
    expect(deps.tokensRepository).toBe(tokensRepository);
  });

  it('carries the network through unchanged', () => {
    expect(
      buildSwapDependencies({ network: 'mainnet', activePublicKey: null })
        .network
    ).toBe('mainnet');
    expect(
      buildSwapDependencies({ network: 'testnet', activePublicKey: null })
        .network
    ).toBe('testnet');
  });

  it('carries the active public key through when an account is connected', () => {
    const deps = buildSwapDependencies({
      network: 'mainnet',
      activePublicKey: '0123456789abcdef'
    });

    expect(deps.activePublicKey).toBe('0123456789abcdef');
  });

  it('reports no active account as a null public key', () => {
    const deps = buildSwapDependencies({
      network: 'mainnet',
      activePublicKey: null
    });

    expect(deps.activePublicKey).toBeNull();
  });

  it('leaves core’s review-hook runners unwired, on any account state', () => {
    const connected = buildSwapDependencies({
      network: 'mainnet',
      activePublicKey: '0123456789abcdef'
    });
    const disconnected = buildSwapDependencies({
      network: 'mainnet',
      activePublicKey: null
    });

    expect(connected.swapFlowRunner).toBeNull();
    expect(connected.wrapFlowRunner).toBeNull();
    expect(disconnected.swapFlowRunner).toBeNull();
    expect(disconnected.wrapFlowRunner).toBeNull();
  });
});
