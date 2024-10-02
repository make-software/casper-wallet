import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { ContactsPlate } from '@popup/pages/contacts/components/contacts-plate';
import { EmptyContacts } from '@popup/pages/contacts/components/empty-contacts';

import {
  selectAllContacts,
  selectAllContactsPublicKeys,
  selectLastModified
} from '@background/redux/contacts/selectors';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import {
  ContentContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { useFetchAccountsInfo } from '@libs/services/account-info';
import { List, Typography } from '@libs/ui/components';
import { formatShortTimestamp } from '@libs/ui/utils';

export const ContactsBookPageContent = () => {
  const { t } = useTranslation();

  const contacts = useSelector(selectAllContacts);
  const lastModified = useSelector(selectLastModified);
  const contactPublicKeys = useSelector(selectAllContactsPublicKeys);

  const contactsWithId = contacts.map((contact, index) => ({
    ...contact,
    id: index,
    accountHash: getAccountHashFromPublicKey(contact.publicKey)
  }));

  const accountsInfo = useFetchAccountsInfo(contactPublicKeys);

  if (contactsWithId.length === 0) {
    return <EmptyContacts />;
  }

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Contacts</Trans>
        </Typography>
      </ParagraphContainer>
      {lastModified && (
        <ParagraphContainer top={SpacingSize.Medium}>
          <Typography type="captionRegular" color="contentSecondary">
            <Trans t={t}>
              Last updated: {formatShortTimestamp(lastModified)}
            </Trans>
          </Typography>
        </ParagraphContainer>
      )}
      <List
        rows={contactsWithId}
        renderRow={({ publicKey, name, accountHash }) => {
          const csprName = accountsInfo && accountsInfo[accountHash]?.csprName;
          const brandingLogo =
            accountsInfo && accountsInfo[accountHash]?.brandingLogo;

          return (
            <ContactsPlate
              publicKey={publicKey}
              name={name}
              csprName={csprName}
              brandingLogo={brandingLogo}
            />
          );
        }}
        marginLeftForItemSeparatorLine={54}
      />
    </ContentContainer>
  );
};
