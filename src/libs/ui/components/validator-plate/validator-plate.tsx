import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FieldError } from 'react-hook-form';

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
} from '@libs/ui';
import { formatNumber, motesToCSPR } from '@libs/ui/utils/formatters';
import { getImageProxyUrl } from '@src/utils';

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
  max-width: 110px;
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
        <Typography type="captionRegular" color="contentPrimary">
          {`${formattedTotalStake} CSPR`}
        </Typography>
        <Typography type="captionRegular" color="contentSecondary">
          {`${formattedFee}% fee`}
        </Typography>
        <Typography type="captionRegular" color="contentSecondary">
          {delegatorsNumber} delegators
        </Typography>
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
