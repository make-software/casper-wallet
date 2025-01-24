import { IAccountInfo } from 'casper-wallet-core/src/domain/accountInfo';
import { Maybe } from 'casper-wallet-core/src/typings/common';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectAllContacts } from '@background/redux/contacts/selectors';
import { Contact } from '@background/redux/contacts/types';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import { SpacingSize } from '@libs/layout';
import { List, RecipientPlate, Tile, Typography } from '@libs/ui/components';

interface ContactsListProps {
  handleSelectRecipient: (publicKey: string, name: string) => void;
  accountsInfo: Record<string, IAccountInfo> | undefined;
  inputValue: string;
}

interface ContactsListState extends Contact {
  id: string;
  csprName: Maybe<string> | undefined;
  brandingLogo: Maybe<string> | undefined;
}

const Container = styled.div`
  padding: 16px;
`;

export const ContactsList = ({
  handleSelectRecipient,
  accountsInfo,
  inputValue
}: ContactsListProps) => {
  const [contactsWithId, setContactsWithId] = useState<ContactsListState[]>([]);

  const contacts = useSelector(selectAllContacts);
  const activeAccount = useSelector(selectVaultActiveAccount);

  useEffect(() => {
    const contactsWithId = contacts
      .map(contact => {
        const accountHash = getAccountHashFromPublicKey(contact.publicKey);

        const csprName = accountsInfo && accountsInfo[accountHash]?.csprName;
        const brandingLogo =
          accountsInfo && accountsInfo[accountHash]?.brandingLogo;

        return {
          ...contact,
          id: contact.name,
          csprName,
          brandingLogo
        };
      })
      .filter(account => account.publicKey !== activeAccount?.publicKey)
      .filter(
        account =>
          account?.name
            .toLowerCase()
            .includes(inputValue?.toLowerCase() || '') ||
          account?.csprName
            ?.toLowerCase()
            .includes(inputValue?.toLowerCase() || '')
      );

    setContactsWithId(contactsWithId);
  }, [contacts, activeAccount, inputValue, accountsInfo]);

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
          csprName={contact.csprName}
          brandingLogo={contact.brandingLogo}
        />
      )}
      marginLeftForItemSeparatorLine={56}
    />
  );
};
