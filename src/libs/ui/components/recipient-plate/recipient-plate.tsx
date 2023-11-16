import React from 'react';
import styled from 'styled-components';

import { FlexRow, SpacingSize } from '@libs/layout';
import { Avatar, FormField, Hash, HashVariant } from '@libs/ui';

interface RecipientPlateProps {
  handleClick?: () => void;
  publicKey: string;
  recipientLabel?: string;
  showFullPublicKey?: boolean;
}

const PublicKeyOptionContainer = styled(FlexRow)<{ onClick?: () => void }>`
  cursor: ${({ onClick }) => (onClick ? 'pointer' : 'initial')};

  padding: 12px 16px;

  background-color: ${({ theme }) => theme.color.backgroundPrimary};
  border-radius: ${({ theme }) => theme.borderRadius.base}px;
`;

export const RecipientPlate = ({
  handleClick,
  publicKey,
  recipientLabel,
  showFullPublicKey
}: RecipientPlateProps) => {
  if (recipientLabel) {
    return (
      <FormField label={recipientLabel}>
        <PublicKeyOptionContainer
          gap={SpacingSize.Medium}
          onClick={handleClick}
        >
          <Avatar publicKey={publicKey} size={24} />
          <Hash
            value={publicKey}
            variant={HashVariant.CaptionHash}
            truncated={!showFullPublicKey}
            truncatedSize="medium"
            withCopyOnSelfClick={false}
            color="contentPrimary"
          />
        </PublicKeyOptionContainer>
      </FormField>
    );
  }

  return (
    <PublicKeyOptionContainer gap={SpacingSize.Medium} onClick={handleClick}>
      <Avatar publicKey={publicKey} size={24} />
      <Hash
        value={publicKey}
        variant={HashVariant.CaptionHash}
        truncated={!showFullPublicKey}
        truncatedSize="medium"
        withCopyOnSelfClick={false}
        color="contentPrimary"
        withoutTooltip
      />
    </PublicKeyOptionContainer>
  );
};
