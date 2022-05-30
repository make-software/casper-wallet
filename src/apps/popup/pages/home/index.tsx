import React from 'react';
import { useSelector } from 'react-redux';

import {
  ContentContainer,
  HeaderTextContainer,
  TextContainer
} from '@layout/containers';
import { Typography, List, ListItemElementContainer } from '@libs/ui';
import { selectVaultAccounts } from '@popup/redux/vault/selectors';

export function HomePageContent() {
  const accounts = useSelector(selectVaultAccounts);

  console.log('accounts', accounts);
  return (
    <ContentContainer>
      <HeaderTextContainer>
        <Typography type="header" weight="semiBold">
          Home Page
        </Typography>
      </HeaderTextContainer>

      <TextContainer>
        <Typography type="body" weight="regular" color="contentSecondary">
          Not implemented yet
        </Typography>
      </TextContainer>
      {accounts.length > 0 && (
        <List
          listItems={accounts.map(account => ({
            id: account.name,
            Content: (
              <ListItemElementContainer gap={10}>
                <Typography type="body" weight="semiBold">
                  {account.name}
                </Typography>
                <Typography
                  type="body"
                  weight="regular"
                  color="contentSecondary"
                >
                  {account.keyPair.signatureAlgorithm}
                </Typography>
              </ListItemElementContainer>
            )
          }))}
        />
      )}
    </ContentContainer>
  );
}
