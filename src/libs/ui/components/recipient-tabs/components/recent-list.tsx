import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectAllContacts } from '@background/redux/contacts/selectors';
import { selectRecentRecipientPublicKeys } from '@background/redux/recent-recipient-public-keys/selectors';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';

import { SpacingSize } from '@libs/layout';
import { List, RecipientPlate, Tile, Typography } from '@libs/ui/components';

interface MyAccountsListProps {
  handleSelectRecipient: (publicKey: string, name: string) => void;
}

interface RecentListState {
  publicKey: string;
  id: string;
  name: string;
}

const Container = styled.div`
  padding: 16px;
`;

export const RecentList = ({ handleSelectRecipient }: MyAccountsListProps) => {
  const [accountsWithIds, setAccountsWithIds] = useState<RecentListState[]>([]);

  const recentRecipientPublicKeys = useSelector(
    selectRecentRecipientPublicKeys
  );
  const contacts = useSelector(selectAllContacts);
  const activeAccount = useSelector(selectVaultActiveAccount);

  useEffect(() => {
    const recentRecipient = recentRecipientPublicKeys
      .map(publicKey => {
        const contact = contacts.find(
          contact => contact.publicKey === publicKey
        );
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
      })
      .filter(account => account.publicKey !== activeAccount?.publicKey);

    setAccountsWithIds(recentRecipient);
  }, [contacts, recentRecipientPublicKeys, setAccountsWithIds, activeAccount]);

  if (!accountsWithIds.length) {
    return (
      <Tile>
        <Container>
          <Typography type="body" color="contentPrimary" textAlign="center">
            No recent recipients found
          </Typography>
        </Container>
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
