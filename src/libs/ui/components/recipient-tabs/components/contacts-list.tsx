import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectAllContacts } from '@background/redux/contacts/selectors';
import { ContactWithId } from '@background/redux/contacts/types';

import { SpacingSize, TileContainer } from '@libs/layout';
import { List, RecipientPlate, Tile, Typography } from '@libs/ui/components';

interface ContactsListProps {
  handleSelectRecipient: (publicKey: string, name: string) => void;
}

export const ContactsList = ({ handleSelectRecipient }: ContactsListProps) => {
  const [contactsWithId, setContactsWithId] = useState<ContactWithId[]>([]);

  const contacts = useSelector(selectAllContacts);

  useEffect(() => {
    const contactsWithId = contacts.map(contact => ({
      ...contact,
      id: contact.name
    }));

    setContactsWithId(contactsWithId);
  }, [contacts]);

  if (contactsWithId.length === 0) {
    return (
      <Tile>
        <TileContainer top={SpacingSize.None}>
          <Typography type="body" color="contentPrimary" textAlign="center">
            No contacts found
          </Typography>
        </TileContainer>
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
