import { formatNumber } from 'casper-wallet-core';
import { CSPR_COIN } from 'casper-wallet-core/src/domain/constants/casperNetwork';
import { Maybe } from 'casper-wallet-core/src/typings/common';
import { formatTokenBalance } from 'casper-wallet-core/src/utils/common';
import React from 'react';
import { FieldError } from 'react-hook-form';
import styled from 'styled-components';

import { getImageProxyUrl } from '@src/utils';

import {
  AlignedFlexRow,
  AlignedSpaceBetweenFlexRow,
  FlexColumn,
  FlexRow,
  RightAlignedFlexColumn,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import {
  Avatar,
  Error,
  FormField,
  Hash,
  HashVariant,
  Typography
} from '@libs/ui/components';

const ValidatorPlateContainer = styled(AlignedFlexRow)<{
  onClick?: () => void;
  withBackground?: boolean;
  withBorder?: boolean;
}>`
  cursor: ${({ onClick }) => (onClick ? 'pointer' : 'initial')};
  background: ${({ withBackground, theme }) =>
    withBackground ? theme.color.backgroundPrimary : 'transparent'};
  border-radius: ${({ theme }) => theme.borderRadius.base}px;
  padding: ${({ withBorder }) => (withBorder ? '11px 0 0 16px' : '11px 16px')};
`;

const InfoContainer = styled(AlignedSpaceBetweenFlexRow)<{
  withBorder?: boolean;
}>`
  border-bottom: ${({ withBorder, theme }) =>
    withBorder ? `0.5px solid ${theme.color.borderPrimary}` : 'none'};
  padding: ${({ withBorder }) => (withBorder ? '0 16px 11px 0' : '0')};
`;

const NameContainer = styled(FlexColumn)`
  max-width: 93px;
`;

const IconContainer = styled.div`
  padding-top: 8px;
`;

const Image = styled.img`
  height: 24px;
  width: 24px;
`;

interface ValidatorPlateProps {
  handleClick?: () => void;
  publicKey: string;
  minAmount: string;
  reservedSlots: number;
  name?: string;
  logo?: string;
  showFullPublicKey?: boolean;
  fee: string;
  delegatorsNumber?: number;
  validatorLabel?: string;
  error?: FieldError;
  formattedTotalStake?: Maybe<string>;
  withBorder?: boolean;
}

export const ValidatorPlate = ({
  publicKey,
  name,
  showFullPublicKey,
  fee,
  handleClick,
  logo,
  delegatorsNumber,
  validatorLabel,
  error,
  formattedTotalStake,
  withBorder,
  minAmount,
  reservedSlots
}: ValidatorPlateProps) => {
  const logoUrl = getImageProxyUrl(logo);

  const totalDelegatorsNumber = (delegatorsNumber ?? 0) + reservedSlots;

  const getFormattedDelegatorsNumber = () => {
    if (totalDelegatorsNumber >= 1000) {
      return (
        formatNumber(totalDelegatorsNumber / 1000, {
          precision: { max: 3 }
        }) + 'k'
      );
    }

    return totalDelegatorsNumber;
  };

  const plateWithFullPublicKey = (
    <ValidatorPlateContainer onClick={handleClick} withBackground>
      <FlexRow gap={SpacingSize.Medium}>
        <IconContainer>
          {logoUrl ? (
            <Image src={logoUrl} alt={name} />
          ) : (
            <Avatar publicKey={publicKey} size={24} />
          )}
        </IconContainer>
        <FlexColumn gap={SpacingSize.Tiny}>
          <Hash
            value={publicKey}
            variant={HashVariant.CaptionHash}
            truncated={!showFullPublicKey}
            truncatedSize="small"
            withCopyOnSelfClick={false}
            color="contentPrimary"
            withoutTooltip
          />
          <Typography type="listSubtext" color="contentSecondary" ellipsis>
            {name}
          </Typography>
        </FlexColumn>
      </FlexRow>
    </ValidatorPlateContainer>
  );

  const plate = (withBackground?: boolean) => (
    <ValidatorPlateContainer
      onClick={handleClick}
      withBackground={withBackground}
      gap={SpacingSize.Medium}
      withBorder={withBorder}
    >
      {logoUrl ? (
        <Image src={logoUrl} alt={name} />
      ) : (
        <Avatar publicKey={publicKey} size={24} />
      )}
      <InfoContainer flexGrow={1} withBorder={withBorder}>
        <NameContainer style={{ gap: '2px' }}>
          <Hash
            value={publicKey}
            variant={HashVariant.CaptionHash}
            truncated={!showFullPublicKey}
            truncatedSize="small"
            withCopyOnSelfClick={false}
            color="contentPrimary"
            withoutTooltip
          />
          <Typography type="listSubtext" color="contentSecondary" ellipsis>
            {name}
          </Typography>
        </NameContainer>
        <RightAlignedFlexColumn style={{ gap: '2px' }}>
          <Typography type="captionHash">
            {`${formattedTotalStake} CSPR`}
          </Typography>
          <AlignedFlexRow gap={SpacingSize.Small}>
            <Typography type="listSubtext" color="contentSecondary">
              {`${fee}% fee`}
            </Typography>
            <Typography type="listSubtext">
              {getFormattedDelegatorsNumber()} delegators
            </Typography>
          </AlignedFlexRow>
          <AlignedFlexRow gap={SpacingSize.Small}>
            <Typography type="listSubtext">
              {`min ${formatTokenBalance(minAmount, CSPR_COIN.decimals)} CSPR`}
            </Typography>
          </AlignedFlexRow>
        </RightAlignedFlexColumn>
      </InfoContainer>
    </ValidatorPlateContainer>
  );

  if (validatorLabel) {
    return (
      <>
        <FormField label={validatorLabel}>
          {showFullPublicKey ? plateWithFullPublicKey : plate(true)}
        </FormField>
        {error && error.message && (
          <VerticalSpaceContainer top={SpacingSize.XL}>
            <Error
              // @ts-ignore
              header={error.message.header}
              // @ts-ignore
              description={error.message.description}
            />
          </VerticalSpaceContainer>
        )}
      </>
    );
  }

  return showFullPublicKey ? plateWithFullPublicKey : plate();
};
