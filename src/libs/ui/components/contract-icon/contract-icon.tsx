import React from 'react';

import { SvgIcon } from '@libs/ui/components';

export interface ContractIconProps {
  src?: string | null;
  size?: number;
  contractTypeId: number | undefined | null;
}

export const ContractTypeId = {
  System: 1,
  Erc20: 2,
  CustomErc20: 3,
  CEP47Nft: 4,
  CustomCEP47Nft: 5,
  DeFi: 6,
  CEP78Nft: 7,
  CustomCEP78Nft: 8
};

const ContractIconsPath = {
  [ContractTypeId.System]: 'assets/icons/bid-contract-icon.svg',
  [ContractTypeId.Erc20]: 'assets/icons/erc20-contract-icon.svg',
  [ContractTypeId.CustomErc20]: 'assets/icons/erc20-contract-icon.svg',
  [ContractTypeId.CEP47Nft]: 'assets/icons/nft-contract-icon.svg',
  [ContractTypeId.CustomCEP47Nft]: 'assets/icons/nft-contract-icon.svg',
  [ContractTypeId.CEP78Nft]: 'assets/icons/nft-contract-icon.svg',
  [ContractTypeId.CustomCEP78Nft]: 'assets/icons/nft-contract-icon.svg',
  [ContractTypeId.DeFi]: 'assets/icons/defi-contract-icon.svg'
};

const genericIconPath = 'assets/icons/generic-contract-icon.svg';

export const ContractIcon = ({
  src,
  size = 16,
  contractTypeId
}: ContractIconProps) => {
  const contractLogoSrc = contractTypeId
    ? ContractIconsPath[contractTypeId]
    : genericIconPath;

  return <SvgIcon size={size} src={src || contractLogoSrc} />;
};
