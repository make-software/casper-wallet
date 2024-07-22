import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  AlignedFlexRow,
  LeftAlignedFlexColumn,
  NftIndexContainer,
  SpacingSize
} from '@libs/layout';
import {
  Avatar,
  Hash,
  HashVariant,
  Link,
  SvgIcon,
  Typography
} from '@libs/ui/components';

interface RecipientInfoRowProps {
  publicKey: string;
  label: string;
}

export const AccountInfoRow = ({ publicKey, label }: RecipientInfoRowProps) => {
  const { t } = useTranslation();

  return (
    <AlignedFlexRow gap={SpacingSize.Small}>
      <Typography type="captionRegular" color="contentSecondary">
        <Trans t={t}>{label}</Trans>
      </Typography>
      <Avatar publicKey={publicKey} size={20} />
      <Hash
        value={publicKey}
        variant={HashVariant.CaptionHash}
        truncated
        truncatedSize="small"
        color="contentAction"
      />
    </AlignedFlexRow>
  );
};

interface ContainerProps {
  entryPointName: string;
  children: React.ReactNode;
}

export const SimpleContainer = ({
  entryPointName,
  children
}: ContainerProps) => (
  <LeftAlignedFlexColumn gap={SpacingSize.Tiny}>
    <Typography type="bodySemiBold">{entryPointName}</Typography>
    {children}
  </LeftAlignedFlexColumn>
);

interface ActionContainerWithAmountProps {
  entryPointName: string;
  children: React.ReactNode;
  amount: string;
  fiatAmount: string;
}

export const ContainerWithAmount = ({
  entryPointName,
  children,
  amount,
  fiatAmount
}: ActionContainerWithAmountProps) => (
  <LeftAlignedFlexColumn gap={SpacingSize.Tiny}>
    <AlignedFlexRow gap={SpacingSize.Small}>
      <Typography type="bodySemiBold">{entryPointName}</Typography>
      <Typography type="bodyHash">{amount}</Typography>
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
  entryPointName: string;
  children: React.ReactNode;
  contractLink: string;
  contractName: string;
  contractIcon: string;
}

export const ActionContainerWithLink = ({
  entryPointName,
  children,
  contractLink,
  contractName,
  contractIcon
}: ActionContainerWithLinkProps) => (
  <LeftAlignedFlexColumn gap={SpacingSize.Tiny}>
    <AlignedFlexRow gap={SpacingSize.Small}>
      <Typography type="bodySemiBold">{entryPointName}</Typography>
      <SvgIcon src={contractIcon} size={20} />
      <Link color="contentAction" href={contractLink}>
        <Typography type="captionRegular">{contractName}</Typography>
      </Link>
    </AlignedFlexRow>
    {children}
  </LeftAlignedFlexColumn>
);

interface NftInfoRowProps {
  nftId?: string;
  label?: string;
  manyNfts?: boolean;
  contractLink?: string;
  contractName: string;
  contractIcon: string;
}

export const NftInfoRow = ({
  nftId,
  contractIcon,
  contractName,
  contractLink,
  label,
  manyNfts
}: NftInfoRowProps) => {
  const { t } = useTranslation();

  return (
    <AlignedFlexRow gap={SpacingSize.Small}>
      {label && (
        <Typography type="captionRegular" color="contentSecondary">
          <Trans t={t}>{label}</Trans>
        </Typography>
      )}
      {manyNfts && (
        <Typography type="captionRegular">
          <Trans t={t}>all</Trans>
        </Typography>
      )}
      <SvgIcon src={contractIcon} size={20} />
      {contractLink ? (
        <Link color="contentAction" href={contractLink}>
          <Typography type="captionRegular">{contractName}</Typography>
        </Link>
      ) : (
        <Typography type="captionHash">{contractName}</Typography>
      )}
      <Typography type="captionRegular" color="contentSecondary">
        {manyNfts ? 'NFT(s)' : 'NFT'}
      </Typography>
      {nftId && (
        <NftIndexContainer>
          <Typography type="captionRegular" color="contentAction">
            {nftId}
          </Typography>
        </NftIndexContainer>
      )}
    </AlignedFlexRow>
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
    <AlignedFlexRow gap={SpacingSize.Small}>
      {label && (
        <Typography type="captionRegular" color="contentSecondary">
          <Trans t={t}>{label}</Trans>
        </Typography>
      )}
      <Typography type="bodyHash">{amount}</Typography>
      <Typography type="bodyHash" color="contentSecondary">
        {symbol}
      </Typography>
      {fiatAmount && (
        <Typography type="body" color="contentSecondary">
          {`(${fiatAmount})`}
        </Typography>
      )}
    </AlignedFlexRow>
  );
};

interface ContractInfoRowProps {
  contractLink: string;
  contractName: string;
  iconUrl: string;
  label?: string;
  additionalInfo?: string;
}

export const ContractInfoRow = ({
  contractLink,
  contractName,
  iconUrl,
  label,
  additionalInfo
}: ContractInfoRowProps) => {
  const { t } = useTranslation();

  return (
    <AlignedFlexRow gap={SpacingSize.Small}>
      {label && (
        <Typography type="captionRegular" color="contentSecondary">
          <Trans t={t}>{label}</Trans>
        </Typography>
      )}
      <SvgIcon src={iconUrl} size={20} />
      <Link color="contentAction" href={contractLink}>
        <Typography type="captionRegular">{contractName}</Typography>
      </Link>
      {additionalInfo && (
        <Typography type="captionRegular" color="contentSecondary">
          <Trans t={t}>{additionalInfo}</Trans>
        </Typography>
      )}
    </AlignedFlexRow>
  );
};
