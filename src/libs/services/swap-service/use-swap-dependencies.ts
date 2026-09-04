import type { ISwapDependencies } from 'casper-wallet-core/src/react';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { getCasperNetwork } from '@src/constants';

import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { dexContractRepository } from '@background/signing-repositories';
import {
  swapRepository,
  tokensRepository
} from '@background/wallet-repositories';

interface BuildSwapDependenciesParams {
  network: ISwapDependencies['network'];
  activePublicKey: string | null;
}

/**
 * Assembles the dependency object core's swap hooks take as their single parameter. Split out
 * of `useSwapDependencies` so it can be tested directly: this repo's jest has no DOM environment
 * to render a hook against.
 */
export const buildSwapDependencies = ({
  network,
  activePublicKey
}: BuildSwapDependenciesParams): ISwapDependencies => ({
  swapRepository,
  dexContractRepository,
  tokensRepository,
  network,
  // Signing belongs to WALLET-1315; the review hooks are never called here.
  swapFlowRunner: null,
  wrapFlowRunner: null,
  activePublicKey
});

export function useSwapDependencies(): ISwapDependencies {
  const networkSetting = useSelector(selectActiveNetworkSetting);
  const activeAccount = useSelector(selectVaultActiveAccount);
  const network = getCasperNetwork(networkSetting);
  const activePublicKey = activeAccount?.publicKey ?? null;

  return useMemo(
    () => buildSwapDependencies({ network, activePublicKey }),
    [network, activePublicKey]
  );
}
