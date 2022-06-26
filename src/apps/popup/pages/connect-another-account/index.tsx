import React from 'react';
import { RootState } from 'typesafe-actions';

import { ContentContainer, HeaderTextContainer } from '@src/layout';
import { Typography } from '@libs/ui';
import { useActiveTabOrigin } from '@popup/hooks/use-active-tab-origin';
import { useSelector } from 'react-redux';
import { selectConnectedAccountsToActiveTab } from '@popup/redux/vault/selectors';

export function ConnectAnotherAccountPageContent() {
  const activeTabOrigin = useActiveTabOrigin();

  const connectedAccountsToActiveTab = useSelector((state: RootState) =>
    selectConnectedAccountsToActiveTab(state, activeTabOrigin)
  );
  return (
    <ContentContainer>
      <HeaderTextContainer>
        <Typography type="header" weight="bold">
          Your current account is not connected
        </Typography>
      </HeaderTextContainer>
      {connectedAccountsToActiveTab.map(account => (
        <div>{account.name}</div>
      ))}
    </ContentContainer>
  );
}
