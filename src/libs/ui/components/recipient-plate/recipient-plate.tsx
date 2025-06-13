import { Maybe } from 'casper-wallet-core/src/typings/common';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  AlignedFlexRow,
  FlexRow,
  LeftAlignedFlexColumn,
  SpacingSize
} from '@libs/layout';
import {
  Avatar,
  FormField,
  Hash,
  HashVariant,
  Typography
} from '@libs/ui/components';

interface RecipientPlateProps {
  handleClick?: () => void;
  publicKey: string;
  recipientLabel?: string;
  showFullPublicKey?: boolean;
  name?: string;
  brandingLogo: Maybe<string> | undefined;
  csprName: Maybe<string> | undefined;
}

const PublicKeyOptionContainer = styled(FlexRow)<{ onClick?: () => void }>`
  cursor: ${({ onClick }) => (onClick ? 'pointer' : 'initial')};

  padding: 12px 16px;

  background-color: ${({ theme }) => theme.color.backgroundPrimary};
  border-radius: ${({ theme }) => theme.borderRadius.base}px;
`;

const Container = styled(PublicKeyOptionContainer)`
  align-items: center;

  padding: 8px 16px;

  min-height: 64px;
`;

export const RecipientPlate = ({
  handleClick,
  publicKey,
  recipientLabel,
  showFullPublicKey,
  name,
  csprName,
  brandingLogo
}: RecipientPlateProps) => {
  const { t } = useTranslation();

  if (recipientLabel) {
    return (
      <FormField label={recipientLabel}>
        <PublicKeyOptionContainer
          gap={SpacingSize.Medium}
          onClick={handleClick}
        >
          <Avatar
            publicKey={publicKey}
            size={24}
            borderRadius={2}
            brandingLogo={brandingLogo}
          />
          <LeftAlignedFlexColumn>
            {csprName && (
              <Typography type="captionMedium">{csprName}</Typography>
            )}
            <Hash
              label={t('Public key')}
              value={publicKey}
              variant={HashVariant.CaptionHash}
              truncated={!showFullPublicKey}
              truncatedSize="medium"
              withCopyOnSelfClick={false}
              color="contentPrimary"
            />
            {name && (
              <Typography type="captionRegular" color="contentSecondary">
                {name}
              </Typography>
            )}
          </LeftAlignedFlexColumn>
        </PublicKeyOptionContainer>
      </FormField>
    );
  }

  return (
    <Container gap={SpacingSize.Medium} onClick={handleClick}>
      <Avatar
        publicKey={publicKey}
        size={24}
        borderRadius={2}
        brandingLogo={brandingLogo}
      />
      <LeftAlignedFlexColumn>
        <Hash
          value={publicKey}
          csprName={csprName}
          variant={HashVariant.CaptionHash}
          truncated={!showFullPublicKey}
          truncatedSize="medium"
          withCopyOnSelfClick={false}
          color="contentPrimary"
          withoutTooltip
        />
        {name && (
          <AlignedFlexRow gap={SpacingSize.Tiny}>
            <Typography type="captionRegular" color="contentSecondary">
              {name}
            </Typography>
          </AlignedFlexRow>
        )}
      </LeftAlignedFlexColumn>
    </Container>
  );
};
