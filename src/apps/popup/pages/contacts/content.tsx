import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { EmptyContacts } from '@popup/pages/contacts/empty-contacts';

import {
  selectAllContacts,
  selectLastModified
} from '@background/redux/contacts/selectors';

import {
  ContentContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { ContactsPlate, List, Typography } from '@libs/ui/components';
import { formatShortTimestamp } from '@libs/ui/utils';

export const ContactsBookPageContent = () => {
  const { t } = useTranslation();

  const contacts = useSelector(selectAllContacts);
  const lastModified = useSelector(selectLastModified);

  const contactsWithId = contacts.map((contact, index) => ({
    ...contact,
    id: index
  }));

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
        renderRow={({ publicKey, name }) => (
          <ContactsPlate publicKey={publicKey} name={name} />
        )}
        marginLeftForItemSeparatorLine={54}
      />
    </ContentContainer>
  );
};
