import React from 'react';
import styled from 'styled-components';

import { FlexRow, SpacingSize } from '@libs/layout';
import { Avatar, FormField, Typography } from '@libs/ui';
import { truncateKey } from '@libs/ui/components/hash/utils';

interface RecipientPlateProps {
  handleClick?: () => void;
  publicKey: string;
  recipientLabel?: string;
  showFullPublicKey?: boolean;
}

const PublicKeyOptionContainer = styled(FlexRow)<{ onClick?: () => void }>`
  cursor: ${({ onClick }) => (onClick ? 'pointer' : 'initial')};

  padding: 8px 16px;

  background-color: ${({ theme }) => theme.color.backgroundPrimary};
  border-radius: ${({ theme }) => theme.borderRadius.eight}px;
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
          <Typography type="captionHash" wordBreak={showFullPublicKey}>
            {showFullPublicKey
              ? publicKey
              : truncateKey(publicKey, { size: 'medium' })}
          </Typography>
        </PublicKeyOptionContainer>
      </FormField>
    );
  }

  return (
    <PublicKeyOptionContainer gap={SpacingSize.Medium} onClick={handleClick}>
      <Avatar publicKey={publicKey} size={24} />
      <Typography type="captionHash" wordBreak={showFullPublicKey}>
        {showFullPublicKey
          ? publicKey
          : truncateKey(publicKey, { size: 'medium' })}
      </Typography>
    </PublicKeyOptionContainer>
  );
};
