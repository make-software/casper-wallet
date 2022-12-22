import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import {
  SiteFaviconBadge,
  Hash,
  HashVariant,
  List,
  Typography,
  Button
} from '@src/libs/ui';

import {
  PageContainer,
  ContentContainer,
  TextContainer,
  LeftAlignedFlexColumn,
  VerticalSpaceContainer
} from '@src/libs/layout';

import {
  selectConnectedAccountsWithOrigin,
  selectVaultActiveAccount
} from '@src/background/redux/vault/selectors';
import { selectActiveOrigin } from '@src/background/redux/session/selectors';
import { useAccountManager } from '@src/apps/popup/hooks/use-account-actions-with-events';
import { closeCurrentWindow } from '@src/background/close-current-window';
import { ConnectionStatusBadge } from '@src/apps/popup/pages/home/components/connection-status-badge';

const CentredFlexRow = styled.div`
  display: flex;
  width: 100%;

  align-items: center;

  gap: 18px;
`;

const ListItemContainer = styled(CentredFlexRow)`
  padding: 14px 18px;
`;

export const SpaceBetweenContainer = styled(CentredFlexRow)`
  justify-content: space-between;
`;

export function SwitchAccountContent() {
  const { t } = useTranslation();

  const activeOrigin = useSelector(selectActiveOrigin);
  const { changeActiveAccountWithEvent: changeActiveAccount } =
    useAccountManager();

  const activeAccount = useSelector(selectVaultActiveAccount);
  const connectedAccountsToActiveTab = useSelector(
    selectConnectedAccountsWithOrigin
  );

  const connectedAccountsListItems = connectedAccountsToActiveTab
    .filter(account => account.name !== activeAccount?.name)
    .map(account => ({
      ...account,
      id: account.name
    }));

  return (
    <PageContainer>
      <ContentContainer>
        <TextContainer gap="big">
          <SiteFaviconBadge origin={activeOrigin} />
          <VerticalSpaceContainer gap="medium">
            <Typography type="header">Switch to another account</Typography>
          </VerticalSpaceContainer>
        </TextContainer>
        {connectedAccountsListItems.length === 0 ? (
          <TextContainer gap="big">
            <Typography type="body">
              Only the active account is connected. To switch accounts you need
              to connect another account first from the wallet extension...
            </Typography>
          </TextContainer>
        ) : (
          <List
            rows={connectedAccountsListItems}
            renderRow={account => (
              <ListItemContainer key={account.name}>
                <SpaceBetweenContainer>
                  <LeftAlignedFlexColumn>
                    <ConnectionStatusBadge
                      isConnected
                      displayContext="accountList"
                    />
                    <Typography type="body">{account.name}</Typography>
                    <Hash
                      value={account.publicKey}
                      variant={HashVariant.CaptionHash}
                      truncated
                    />
                  </LeftAlignedFlexColumn>
                  <Button
                    color="secondaryBlue"
                    variant="inline"
                    width="100"
                    onClick={async () => {
                      await changeActiveAccount(account.name);
                      closeCurrentWindow();
                    }}
                  >
                    <Trans t={t}>Switch</Trans>
                  </Button>
                </SpaceBetweenContainer>
              </ListItemContainer>
            )}
            marginLeftForItemSeparatorLine={60}
          />
        )}
      </ContentContainer>
    </PageContainer>
  );
}
