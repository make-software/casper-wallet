import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectAllContacts } from '@background/redux/contacts/selectors';
import { ContactWithId } from '@background/redux/contacts/types';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';

import { SpacingSize } from '@libs/layout';
import { List, RecipientPlate, Tile, Typography } from '@libs/ui/components';

interface ContactsListProps {
  handleSelectRecipient: (publicKey: string, name: string) => void;
}

const Container = styled.div`
  padding: 16px;
`;

export const ContactsList = ({ handleSelectRecipient }: ContactsListProps) => {
  const [contactsWithId, setContactsWithId] = useState<ContactWithId[]>([]);

  const contacts = useSelector(selectAllContacts);
  const activeAccount = useSelector(selectVaultActiveAccount);

  useEffect(() => {
    const contactsWithId = contacts
      .map(contact => ({
        ...contact,
        id: contact.name
      }))
      .filter(account => account.publicKey !== activeAccount?.publicKey);

    setContactsWithId(contactsWithId);
  }, [contacts, activeAccount]);

  if (contactsWithId.length === 0) {
    return (
      <Tile>
        <Container>
          <Typography type="body" color="contentPrimary" textAlign="center">
            No contacts found
          </Typography>
        </Container>
      </Tile>
    );
  }

  return (
    <List
      contentTop={SpacingSize.None}
      rows={contactsWithId}
      renderRow={contact => (
        <RecipientPlate
          publicKey={contact.publicKey}
          name={contact.name}
          handleClick={() => {
            handleSelectRecipient(contact.publicKey, contact.name);
          }}
        />
      )}
      marginLeftForItemSeparatorLine={56}
    />
  );
};
