import React, { useEffect, useState } from 'react';
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
import { formatNumber, motesToCSPR } from '@libs/ui/utils/formatters';

const ValidatorPlateContainer = styled(AlignedSpaceBetweenFlexRow)<{
  onClick?: () => void;
  withBackground?: boolean;
}>`
  cursor: ${({ onClick }) => (onClick ? 'pointer' : 'initial')};
  background: ${({ withBackground, theme }) =>
    withBackground ? theme.color.backgroundPrimary : 'transparent'};
  border-radius: ${({ theme }) => theme.borderRadius.base}px;

  padding: 8px 16px;
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
  name?: string;
  logo?: string;
  showFullPublicKey?: boolean;
  fee: number;
  delegatorsNumber?: number;
  validatorLabel?: string;
  error?: FieldError;
  totalStake?: string;
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
  totalStake
}: ValidatorPlateProps) => {
  const [formattedTotalStake, setFormattedTotalStake] = useState('');

  useEffect(() => {
    if (totalStake) {
      setFormattedTotalStake(formatNumber(motesToCSPR(totalStake)));
    }
  }, [totalStake]);

  const logoUrl = getImageProxyUrl(logo);
  const formattedFee = formatNumber(fee, {
    precision: { min: 2 }
  });
  const getFormattedDelegatorsNumber = () => {
    if (delegatorsNumber && delegatorsNumber >= 1000) {
      return (
        formatNumber(delegatorsNumber / 1000, {
          precision: { max: 2 }
        }) + 'k'
      );
    }

    return delegatorsNumber;
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
        <FlexColumn>
          <Hash
            value={publicKey}
            variant={HashVariant.CaptionHash}
            truncated={!showFullPublicKey}
            truncatedSize="small"
            withCopyOnSelfClick={false}
            color="contentPrimary"
            withoutTooltip
          />
          <Typography type="captionRegular" color="contentSecondary" ellipsis>
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
    >
      <AlignedFlexRow gap={SpacingSize.Medium}>
        {logoUrl ? (
          <Image src={logoUrl} alt={name} />
        ) : (
          <Avatar publicKey={publicKey} size={24} />
        )}
        <NameContainer>
          <Hash
            value={publicKey}
            variant={HashVariant.CaptionHash}
            truncated={!showFullPublicKey}
            truncatedSize="small"
            withCopyOnSelfClick={false}
            color="contentPrimary"
            withoutTooltip
          />
          <Typography type="captionRegular" color="contentSecondary" ellipsis>
            {name}
          </Typography>
        </NameContainer>
      </AlignedFlexRow>
      <RightAlignedFlexColumn>
        <Typography type="captionHash" color="contentPrimary">
          {`${formattedTotalStake} CSPR`}
        </Typography>
        <AlignedFlexRow gap={SpacingSize.Small}>
          <Typography type="listSubtext" color="contentSecondary">
            {`${formattedFee}% fee`}
          </Typography>
          <Typography type="listSubtext" color="contentSecondary">
            {getFormattedDelegatorsNumber()} delegators
          </Typography>
        </AlignedFlexRow>
      </RightAlignedFlexColumn>
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
              header="This validator has max delegators"
              description={error.message}
            />
          </VerticalSpaceContainer>
        )}
      </>
    );
  }

  return showFullPublicKey ? plateWithFullPublicKey : plate();
};
