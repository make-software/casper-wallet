import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectAllContactsPublicKeys } from '@background/redux/contacts/selectors';
import { Contact } from '@background/redux/contacts/types';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import {
  ContentContainer,
  FlexColumn,
  LeftAlignedFlexColumn,
  SpacingSize
} from '@libs/layout';
import { useFetchAccountsInfo } from '@libs/services/account-info';
import {
  Avatar,
  Hash,
  HashVariant,
  Tile,
  Typography
} from '@libs/ui/components';
import { formatShortTimestamp } from '@libs/ui/utils';

const Container = styled(LeftAlignedFlexColumn)`
  margin-top: 24px;
  padding: 32px 16px 16px;

  gap: 32px;
`;

interface ContactDetailsProps {
  contact: Contact;
}

export const ContactDetails = ({ contact }: ContactDetailsProps) => {
  const { t } = useTranslation();

  const contactPublicKeys = useSelector(selectAllContactsPublicKeys);

  const accountsInfo = useFetchAccountsInfo(contactPublicKeys);

  const accountHash = getAccountHashFromPublicKey(contact.publicKey);
  const csprName = accountsInfo && accountsInfo[accountHash]?.csprName;

  return (
    <ContentContainer>
      <Tile>
        <Container>
          <Avatar publicKey={contact.publicKey} size={88} borderRadius={12} />
          <LeftAlignedFlexColumn gap={SpacingSize.Large}>
            <Typography type="header">{contact.name}</Typography>
            <Hash
              value={contact.publicKey}
              variant={HashVariant.CaptionHash}
              color="contentPrimary"
            />
            {csprName ? (
              <FlexColumn gap={SpacingSize.Small}>
                <Typography type="bodySemiBold">
                  <Trans t={t}>CSPR.name</Trans>
                </Typography>
                <Typography type="captionRegular" color="contentSecondary">
                  {csprName}
                </Typography>
              </FlexColumn>
            ) : null}
            <Typography type="captionRegular" color="contentSecondary">
              <Trans t={t}>
                Last edited: {formatShortTimestamp(contact.lastModified)}
              </Trans>
            </Typography>
          </LeftAlignedFlexColumn>
        </Container>
      </Tile>
    </ContentContainer>
  );
};
