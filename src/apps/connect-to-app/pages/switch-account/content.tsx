import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

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
  ParagraphContainer,
  LeftAlignedFlexColumn,
  VerticalSpaceContainer,
  SpacingSize
} from '@src/libs/layout';

import {
  selectConnectedAccountsWithOrigin,
  selectUnconnectedAccountsWithOrigin,
  selectVaultActiveAccount
} from '@src/background/redux/vault/selectors';
import { selectActiveOrigin } from '@src/background/redux/active-origin/selectors';
import { useAccountManager } from '@src/apps/popup/hooks/use-account-actions-with-events';
import { closeCurrentWindow } from '@src/background/close-current-window';
import { ConnectionStatusBadge } from '@src/apps/popup/pages/home/components/connection-status-badge';

import {
  UnconnectedAccountsList,
  SpaceBetweenContainer,
  ListItemContainer
} from './unconnected-accounts-list';
import { sendSdkResponseToSpecificTab } from '@src/background/send-sdk-response-to-specific-tab';
import { sdkMethod } from '@src/content/sdk-method';

type SwitchAccountContentProps = { requestId: string };

export function SwitchAccountContent({ requestId }: SwitchAccountContentProps) {
  const activeOrigin = useSelector(selectActiveOrigin);
  const activeAccount = useSelector(selectVaultActiveAccount);
  const connectedAccountsToActiveTab = useSelector(
    selectConnectedAccountsWithOrigin
  );
  const unconnectedAccounts = useSelector(selectUnconnectedAccountsWithOrigin);

  const { t } = useTranslation();
  const { changeActiveAccountWithEvent: changeActiveAccount } =
    useAccountManager();

  const connectedAccountsListItems = connectedAccountsToActiveTab
    .filter(account => account.name !== activeAccount?.name)
    .map(account => ({
      ...account,
      id: account.name
    }));

  const unconnectedAccountsList = unconnectedAccounts.map(account => ({
    ...account,
    id: account.name
  }));

  const isActiveAccountConnected: boolean = unconnectedAccountsList.every(
    account => account.name !== activeAccount?.name
  );

  return (
    <PageContainer>
      <ContentContainer>
        <ParagraphContainer top={SpacingSize.Big}>
          <SiteFaviconBadge origin={activeOrigin} />
          <VerticalSpaceContainer top={SpacingSize.Medium}>
            <Typography type="header">Switch to another account</Typography>
          </VerticalSpaceContainer>
        </ParagraphContainer>
        {/*The active account and other accounts are not connected*/}
        {connectedAccountsListItems.length === 0 &&
          !isActiveAccountConnected && (
            <ParagraphContainer top={SpacingSize.Big}>
              <Typography type="body">
                <Trans t={t}>
                  There is no connected account. First you need to connect
                  account from the wallet extension.
                </Trans>
              </Typography>
            </ParagraphContainer>
          )}
        {/*There is only active account connected*/}
        {connectedAccountsListItems.length === 0 &&
          isActiveAccountConnected && (
            <>
              <ParagraphContainer top={SpacingSize.Big}>
                <Typography type="body">
                  {unconnectedAccountsList.length > 0 ? (
                    <Trans t={t}>
                      Only the active account is connected. To switch accounts
                      you need to connect another account.
                    </Trans>
                  ) : (
                    <Trans t={t}>
                      Only the active account is connected. To switch accounts
                      you need to connect another account first from the wallet
                      extension...
                    </Trans>
                  )}
                </Typography>
              </ParagraphContainer>
              <UnconnectedAccountsList
                requestId={requestId}
                unconnectedAccountsList={unconnectedAccountsList}
              />
            </>
          )}
        {/*There are one or more connected accounts*/}
        {connectedAccountsListItems.length >= 1 && (
          <>
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
                      inline
                      width="100"
                      onClick={async () => {
                        await changeActiveAccount(account.name);
                        await sendSdkResponseToSpecificTab(
                          sdkMethod.switchAccountResponse(true, { requestId })
                        );
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
            <UnconnectedAccountsList
              requestId={requestId}
              unconnectedAccountsList={unconnectedAccountsList}
            />
          </>
        )}
      </ContentContainer>
    </PageContainer>
  );
}
