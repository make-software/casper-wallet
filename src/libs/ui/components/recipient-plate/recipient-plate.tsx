import React from 'react';
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
  SvgIcon,
  Typography
} from '@libs/ui';

interface RecipientPlateProps {
  handleClick?: () => void;
  publicKey: string;
  recipientLabel?: string;
  showFullPublicKey?: boolean;
  name?: string;
  isContact?: boolean;
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
  isContact
}: RecipientPlateProps) => {
  if (recipientLabel) {
    return (
      <FormField label={recipientLabel}>
        <PublicKeyOptionContainer
          gap={SpacingSize.Medium}
          onClick={handleClick}
        >
          <Avatar publicKey={publicKey} size={24} />
          <LeftAlignedFlexColumn>
            <Hash
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
      <Avatar publicKey={publicKey} size={24} />
      <LeftAlignedFlexColumn>
        <Hash
          value={publicKey}
          variant={HashVariant.CaptionHash}
          truncated={!showFullPublicKey}
          truncatedSize="medium"
          withCopyOnSelfClick={false}
          color="contentPrimary"
          withoutTooltip
        />
        {name && (
          <AlignedFlexRow gap={SpacingSize.Tiny}>
            {isContact && <SvgIcon src="assets/icons/contact.svg" size={16} />}
            <Typography type="captionRegular" color="contentSecondary">
              {name}
            </Typography>
          </AlignedFlexRow>
        )}
      </LeftAlignedFlexColumn>
    </Container>
  );
};
