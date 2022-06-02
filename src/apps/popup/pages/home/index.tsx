import React from 'react';
import { useSelector } from 'react-redux';

import {
  ContentContainer,
  HeaderTextContainer,
  TextContainer
} from '@src/layout/containers';
import { Typography, List, ListItemElementContainer } from '@libs/ui';
import { selectVaultAccounts } from '@popup/redux/vault/selectors';
import { truncateKey } from '@popup/pages/home/utils';

export function HomePageContent() {
  const accounts = useSelector(selectVaultAccounts);

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
              <ListItemElementContainer>
                <Typography type="body" weight="semiBold">
                  {account.name}
                </Typography>
                <Typography
                  type="body"
                  weight="regular"
                  color="contentSecondary"
                >
                  {truncateKey(account.keyPair.publicKey)}
                </Typography>
              </ListItemElementContainer>
            )
          }))}
        />
      )}
    </ContentContainer>
  );
}
