import React from 'react';

import { isBundledAssetPath } from '@src/utils';

// Kept out of common.tsx and imported by path, not through the barrel: that file
// also pulls in '@libs/layout' and redux, which a node-environment test can't load.
import { RemoteIcon } from '@libs/ui/components/remote-icon/remote-icon';
import { SvgIcon } from '@libs/ui/components/svg-icon/svg-icon';

export interface ContractIconProps {
  contractIcon: string;
  contractName: string;
}

export const ContractIcon = ({
  contractIcon,
  contractName
}: ContractIconProps) =>
  isBundledAssetPath(contractIcon) ? (
    <SvgIcon src={contractIcon} size={20} />
  ) : (
    <RemoteIcon src={contractIcon} size={20} alt={contractName} />
  );
