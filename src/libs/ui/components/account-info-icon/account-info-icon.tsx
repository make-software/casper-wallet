import { Maybe } from 'casper-wallet-core/src/typings/common';
import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { DeployIcon } from '@src/constants';
import { isEqualCaseInsensitive, isPublicKeyHash } from '@src/utils';

import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';

import { Avatar, SvgIcon } from '@libs/ui/components';

interface AccountInfoIconProps {
  iconUrl?: Maybe<string>;
  accountName?: Maybe<string>;
  publicKey: Maybe<string>;
  size?: number;
  defaultSvg?: string;
}

const LogoImg = styled.img<{ size: number }>`
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
`;

export const AccountInfoIcon = ({
  iconUrl,
  accountName,
  publicKey,
  size = 16,
  defaultSvg
}: AccountInfoIconProps) => {
  const {
    auctionPoolContractHash,
    associatedKeysContractHash,
    csprStudioCep47ContractHash,
    csprMarketContractHash
  } = useSelector(selectApiConfigBasedOnActiveNetwork);

  if (publicKey && isEqualCaseInsensitive(publicKey, auctionPoolContractHash)) {
    return <SvgIcon src={DeployIcon.Auction} size={size} />;
  } else if (
    publicKey &&
    isEqualCaseInsensitive(publicKey, associatedKeysContractHash)
  ) {
    return <SvgIcon src={DeployIcon.AssociatedKeys} size={size} />;
  } else if (
    publicKey &&
    isEqualCaseInsensitive(publicKey, csprStudioCep47ContractHash)
  ) {
    return <SvgIcon src={DeployIcon.CSPRStudio} size={size} />;
  } else if (
    publicKey &&
    isEqualCaseInsensitive(publicKey, csprMarketContractHash)
  ) {
    return <SvgIcon src={DeployIcon.CSPRMarket} size={size} />;
  }

  if (iconUrl) {
    return iconUrl.endsWith('.svg') ? (
      <SvgIcon src={iconUrl || ''} alt={accountName || ''} size={size} />
    ) : (
      <LogoImg
        src={iconUrl}
        size={size}
        alt={accountName || ''}
        title={publicKey || ''}
      />
    );
  }

  if (defaultSvg && !isPublicKeyHash(publicKey)) {
    return <SvgIcon src={defaultSvg} size={size} />;
  }

  if (publicKey?.startsWith('uref')) {
    return null;
  }

  return <Avatar publicKey={publicKey} size={size} />;
};
