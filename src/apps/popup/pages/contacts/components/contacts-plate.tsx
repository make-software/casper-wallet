import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { RouterPath, useTypedNavigate } from '@popup/router';

import { selectAllContactsPublicKeys } from '@background/redux/contacts/selectors';

import { AlignedFlexRow, FlexColumn, SpacingSize } from '@libs/layout';
import { useFetchAccountsInfo } from '@libs/services/account-info';
import { Avatar, Hash, HashVariant, Typography } from '@libs/ui/components';

const Container = styled(AlignedFlexRow)`
  cursor: pointer;

  padding: 8px 16px;
`;

interface ContactsPlateProps {
  publicKey: string;
  name: string;
  accountHash: string;
}

export const ContactsPlate = ({
  publicKey,
  name,
  accountHash
}: ContactsPlateProps) => {
  const navigate = useTypedNavigate();

  const contactPublicKeys = useSelector(selectAllContactsPublicKeys);
  const accountsInfo = useFetchAccountsInfo(contactPublicKeys);

  const csprName = accountsInfo && accountsInfo[accountHash]?.csprName;
  const brandingLogo = accountsInfo && accountsInfo[accountHash]?.brandingLogo;

  return (
    <Container
      gap={SpacingSize.Medium}
      onClick={() => {
        navigate(RouterPath.ContactDetails.replace(':contactName', name));
      }}
    >
      <Avatar
        publicKey={publicKey}
        size={24}
        borderRadius={2}
        brandingLogo={brandingLogo}
      />
      <FlexColumn>
        <Typography type="captionRegular">{name}</Typography>
        <Hash
          value={publicKey}
          csprName={csprName}
          variant={HashVariant.CaptionHash}
          truncatedSize="medium"
          truncated
        />
      </FlexColumn>
    </Container>
  );
};
