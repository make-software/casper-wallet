import { formatAddress } from 'casper-wallet-core';
import { Maybe } from 'casper-wallet-core/src/typings/common';
import React, { useCallback, useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import {
  DeployIcon,
  getBlockExplorerContractPackageUrl,
  getContractNftUrl
} from '@src/constants';
import { isEqualCaseInsensitive } from '@src/utils';

import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';

import {
  AlignedFlexRow,
  LeftAlignedFlexColumn,
  SpacingSize
} from '@libs/layout';
import { useFetchContractPackage } from '@libs/services/contract-package';
import { Link, SvgIcon, Typography } from '@libs/ui/components';
import { AccountInfoIcon } from '@libs/ui/components/account-info-icon/account-info-icon';

const AlignedFlexRowContainer = styled(AlignedFlexRow)`
  column-gap: 8px;
  flex-wrap: wrap;
`;

export const NftIndexContainer = styled.div`
  padding: 0 6px;
  background: ${({ theme }) => theme.color.backgroundSecondary};
  max-width: 296px;
`;

interface ContainerProps {
  title: string;
  children: React.ReactNode;
}

export const SimpleContainer = ({ title, children }: ContainerProps) => (
  <LeftAlignedFlexColumn gap={SpacingSize.Tiny}>
    <Typography type="bodySemiBold">{title}</Typography>
    {children}
  </LeftAlignedFlexColumn>
);

interface ActionContainerWithAmountProps {
  title: string;
  children: React.ReactNode;
  amount: string;
  fiatAmount: string;
}

export const ContainerWithAmount = ({
  title,
  children,
  amount,
  fiatAmount
}: ActionContainerWithAmountProps) => (
  <LeftAlignedFlexColumn gap={SpacingSize.Tiny}>
    <AlignedFlexRow gap={SpacingSize.Small} style={{ maxWidth: '296px' }}>
      <Typography type="bodySemiBold">{title}</Typography>
      <Typography type="bodyHash" ellipsis>
        {amount}
      </Typography>
      <Typography type="bodyHash" color="contentSecondary">
        CSPR
      </Typography>
      <Typography type="body" color="contentSecondary">
        {`(${fiatAmount})`}
      </Typography>
    </AlignedFlexRow>
    {children}
  </LeftAlignedFlexColumn>
);

interface ActionContainerWithLinkProps {
  title: string;
  children: React.ReactNode;
  contractName: string;
  contractIcon: string;
  contractPackageHash: string;
  contractLink?: Maybe<string>;
}

export const ActionContainerWithLink = ({
  title,
  children,
  contractName,
  contractIcon,
  contractPackageHash,
  contractLink
}: ActionContainerWithLinkProps) => {
  const { casperLiveUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);

  const link = getBlockExplorerContractPackageUrl(
    casperLiveUrl,
    contractPackageHash || ''
  );

  return (
    <LeftAlignedFlexColumn gap={SpacingSize.Tiny}>
      <AlignedFlexRow gap={SpacingSize.Small}>
        <Typography type="bodySemiBold">{title}</Typography>
        <SvgIcon src={contractIcon} size={20} />
        <Link color="contentAction" href={contractLink ?? link} target="_blank">
          <Typography type="captionRegular">{contractName}</Typography>
        </Link>
      </AlignedFlexRow>
      {children}
    </LeftAlignedFlexColumn>
  );
};

interface NftInfoRowProps {
  nftTokenIds: string[];
  nftTokenUrlsMap: Record<string, string | null>;
  label?: string;
  imgLogo?: Maybe<string>;
  contractPackageHash?: string;
  contractHash: string;
  collectionName?: Maybe<string>;
  isApprove?: boolean;
  defaultSvg?: string;
  collectionHash: string;
  contractLink?: Maybe<string>;
}

export const NftInfoRow = ({
  nftTokenIds,
  nftTokenUrlsMap,
  imgLogo,
  label,
  contractPackageHash,
  contractHash,
  isApprove,
  defaultSvg,
  collectionHash,
  collectionName,
  contractLink
}: NftInfoRowProps) => {
  const { t } = useTranslation();

  const { csprStudioCep47ContractHash, casperLiveUrl } = useSelector(
    selectApiConfigBasedOnActiveNetwork
  );

  const { contractPackage: collectionContractPackage } =
    useFetchContractPackage(collectionHash);

  const isCsprStudio = useMemo(
    () => isEqualCaseInsensitive(contractHash, csprStudioCep47ContractHash),
    [contractHash, csprStudioCep47ContractHash]
  );
  const hash = useMemo(
    () => (isCsprStudio ? contractHash : contractPackageHash),
    [contractHash, contractPackageHash, isCsprStudio]
  );

  const link = getBlockExplorerContractPackageUrl(casperLiveUrl, hash || '');

  const getCollectionName = useCallback(() => {
    if (isCsprStudio) {
      return 'CSPR.studio';
    }

    return (
      collectionName ??
      collectionContractPackage?.name ??
      formatAddress(collectionHash)
    );
  }, [
    collectionContractPackage?.name,
    collectionHash,
    collectionName,
    isCsprStudio
  ]);

  return (
    <AlignedFlexRowContainer>
      {label && (
        <Typography type="captionRegular" color="contentSecondary">
          <Trans t={t}>{label}</Trans>
        </Typography>
      )}
      {nftTokenIds.length > 1 && (
        <Typography type="captionRegular">
          <Trans t={t}>all</Trans>
        </Typography>
      )}
      <AccountInfoIcon
        publicKey={isCsprStudio ? contractHash : collectionHash || ''}
        accountName={getCollectionName()}
        iconUrl={imgLogo}
        size={20}
        defaultSvg={defaultSvg ?? DeployIcon.NFTDefault}
      />
      <Link color="contentAction" href={contractLink ?? link} target="_blank">
        <Typography type="captionRegular">{getCollectionName()}</Typography>
      </Link>
      <Typography type="captionRegular" color="contentSecondary">
        {isApprove || nftTokenIds.length > 1 ? 'NFT(s)' : 'NFT'}
      </Typography>
      {nftTokenIds.map(id => (
        <NftIndexContainer key={id}>
          <Link
            color="contentAction"
            target="_blank"
            href={
              nftTokenUrlsMap[id] ??
              getContractNftUrl(casperLiveUrl, hash || '', id)
            }
          >
            <Typography type="captionRegular" color="contentAction" ellipsis>
              {id}
            </Typography>
          </Link>
        </NftIndexContainer>
      ))}
    </AlignedFlexRowContainer>
  );
};

interface AmountRowProps {
  label?: string;
  amount: string;
  symbol: string;
  fiatAmount?: string;
}

export const AmountRow = ({
  label,
  amount,
  symbol,
  fiatAmount
}: AmountRowProps) => {
  const { t } = useTranslation();

  return (
    <AlignedFlexRowContainer
      gap={SpacingSize.Small}
      style={{ maxWidth: '296px' }}
    >
      {label && (
        <Typography type="captionRegular" color="contentSecondary">
          <Trans t={t}>{label}</Trans>
        </Typography>
      )}
      <Typography type="bodyHash" ellipsis>
        {amount}
      </Typography>
      <Typography type="bodyHash" color="contentSecondary">
        {symbol}
      </Typography>
      {fiatAmount && (
        <Typography type="body" color="contentSecondary">
          {`(${fiatAmount})`}
        </Typography>
      )}
    </AlignedFlexRowContainer>
  );
};

interface ContractInfoRowProps {
  contractPackageHash: string;
  contractName: string;
  iconUrl?: Maybe<string>;
  label?: string;
  additionalInfo?: string;
  defaultSvg?: string;
  contractLink?: Maybe<string>;
}

export const ContractInfoRow = ({
  contractPackageHash,
  contractName,
  label,
  additionalInfo,
  iconUrl,
  defaultSvg,
  contractLink
}: ContractInfoRowProps) => {
  const { t } = useTranslation();

  const { casperLiveUrl } = useSelector(selectApiConfigBasedOnActiveNetwork); // Fetch the live Casper network URL from Redux store.  // Assuming 'publicKey' is the public key of the contract.  // Replace 'casperLiveUrl' with the actual live Casper network URL.  // Fetch the contract details using the public key.  // Display the contract name, icon, and additional information.  // If the contract details are not found, display a

  const link = getBlockExplorerContractPackageUrl(
    casperLiveUrl,
    contractPackageHash || ''
  );

  return (
    <AlignedFlexRowContainer gap={SpacingSize.Small}>
      {label && (
        <Typography type="captionRegular" color="contentSecondary">
          <Trans t={t}>{label}</Trans>
        </Typography>
      )}
      <AccountInfoIcon
        publicKey={contractPackageHash}
        size={20}
        accountName={contractName}
        iconUrl={iconUrl}
        defaultSvg={defaultSvg}
      />
      <Link color="contentAction" href={contractLink ?? link} target="_blank">
        <Typography type="captionRegular" ellipsis style={{ maxWidth: 220 }}>
          {contractName}
        </Typography>
      </Link>
      {additionalInfo && (
        <Typography type="captionRegular" color="contentSecondary">
          <Trans t={t}>{additionalInfo}</Trans>
        </Typography>
      )}
    </AlignedFlexRowContainer>
  );
};
