import { Maybe } from 'casper-wallet-core/src/typings/common';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { RouterPath, useTypedNavigate } from '@popup/router';

import { AlignedFlexRow, FlexColumn, SpacingSize } from '@libs/layout';
import { Avatar, Hash, HashVariant, Typography } from '@libs/ui/components';

const Container = styled(AlignedFlexRow)`
  cursor: pointer;

  padding: 8px 16px;
`;

interface ContactsPlateProps {
  publicKey: string;
  name: string;
  csprName: Maybe<string> | undefined;
  brandingLogo: Maybe<string> | undefined;
}

export const ContactsPlate = ({
  publicKey,
  name,
  csprName,
  brandingLogo
}: ContactsPlateProps) => {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

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
          label={t('Public key')}
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
