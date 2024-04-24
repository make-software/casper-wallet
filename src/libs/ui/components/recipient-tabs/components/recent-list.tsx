import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectAllContacts } from '@background/redux/contacts/selectors';
import { selectRecentRecipientPublicKeys } from '@background/redux/recent-recipient-public-keys/selectors';

import { SpacingSize, TileContainer } from '@libs/layout';
import { List, RecipientPlate, Tile, Typography } from '@libs/ui/components';

interface MyAccountsListProps {
  handleSelectRecipient: (publicKey: string, name: string) => void;
}

interface RecentListState {
  publicKey: string;
  id: string;
  name: string;
}

export const RecentList = ({ handleSelectRecipient }: MyAccountsListProps) => {
  const [accountsWithIds, setAccountsWithIds] = useState<RecentListState[]>([]);

  const recentRecipientPublicKeys = useSelector(
    selectRecentRecipientPublicKeys
  );
  const contacts = useSelector(selectAllContacts);

  useEffect(() => {
    const recentRecipient = recentRecipientPublicKeys.map(publicKey => {
      const contact = contacts.find(contact => contact.publicKey === publicKey);
      if (contact) {
        return {
          name: contact.name,
          publicKey: publicKey,
          id: publicKey
        };
      }
      return {
        name: '',
        publicKey: publicKey,
        id: publicKey
      };
    });

    setAccountsWithIds(recentRecipient);
  }, [contacts, recentRecipientPublicKeys, setAccountsWithIds]);

  if (!accountsWithIds.length) {
    return (
      <Tile>
        <TileContainer top={SpacingSize.None}>
          <Typography type="body" color="contentPrimary" textAlign="center">
            No recent recipients were found.
          </Typography>
        </TileContainer>
      </Tile>
    );
  }

  return (
    <List
      contentTop={SpacingSize.None}
      rows={accountsWithIds}
      renderRow={recent => (
        <RecipientPlate
          publicKey={recent.publicKey}
          name={recent.name}
          handleClick={() => {
            handleSelectRecipient(recent.publicKey, recent.name);
          }}
        />
      )}
      marginLeftForItemSeparatorLine={56}
    />
  );
};
