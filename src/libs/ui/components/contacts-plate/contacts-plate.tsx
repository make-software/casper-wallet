import React from 'react';
import styled from 'styled-components';

import { AlignedFlexRow, FlexColumn, SpacingSize } from '@libs/layout';
import { Avatar, Hash, HashVariant, Typography } from '@libs/ui';
import { RouterPath, useTypedNavigate } from '@popup/router';

const Container = styled(AlignedFlexRow)`
  cursor: pointer;

  padding: 8px 16px;
`;

interface ContactsPlateProps {
  publicKey: string;
  name: string;
}

export const ContactsPlate = ({ publicKey, name }: ContactsPlateProps) => {
  const navigate = useTypedNavigate();

  return (
    <Container
      gap={SpacingSize.Medium}
      onClick={() => {
        navigate(RouterPath.ContactDetails.replace(':contactName', name));
      }}
    >
      <Avatar publicKey={publicKey} size={24} />
      <FlexColumn>
        <Typography type="captionRegular">{name}</Typography>
        <Hash
          value={publicKey}
          variant={HashVariant.CaptionHash}
          truncatedSize="medium"
          truncated
        />
      </FlexColumn>
    </Container>
  );
};
