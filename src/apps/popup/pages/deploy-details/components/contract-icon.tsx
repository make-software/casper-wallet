import React from 'react';

import { isBundledAssetPath } from '@src/utils';

// Imported by path, not through the '@libs/ui/components' barrel, and kept in
// its own module rather than inline in common.tsx: that file also pulls in
// '@libs/layout' and redux (useSelector), which a node-environment test can't
// load or render standalone. This routing branch is small enough to be worth
// testing on its own.
import { RemoteIcon } from '@libs/ui/components/remote-icon/remote-icon';
import { SvgIcon } from '@libs/ui/components/svg-icon/svg-icon';

export interface ContractIconProps {
  contractIcon: string;
  contractName: string;
}

/** Routes a contract's icon: bundled paths are inlined, everything else is a plain img. */
export const ContractIcon = ({
  contractIcon,
  contractName
}: ContractIconProps) =>
  isBundledAssetPath(contractIcon) ? (
    <SvgIcon src={contractIcon} size={20} />
  ) : (
    <RemoteIcon src={contractIcon} size={20} alt={contractName} />
  );
