import React from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  ContentContainer,
  LeftAlignedFlexColumn,
  ParagraphContainer,
  VerticalSpaceContainer
} from '@src/libs/layout';
import {
  Button,
  SiteFaviconBadge,
  Hash,
  HashVariant,
  List,
  PageTile,
  SvgIcon,
  Typography
} from '@libs/ui';

import {
  selectConnectedAccountsWithOrigin,
  selectVaultAccounts,
  selectVaultActiveAccount
} from '@src/background/redux/vault/selectors';
import { RouterPath, useTypedNavigate } from '@popup/router';
import { useAccountManager } from '@src/apps/popup/hooks/use-account-actions-with-events';
import { selectActiveOrigin } from '@src/background/redux/session/selectors';

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

export function ConnectAnotherAccountPageContent() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();
  const { targetAccountName } = useParams();

  const activeOrigin = useSelector(selectActiveOrigin);
  const {
    connectAccountsWithEvent: connectAccounts,
    changeActiveAccountWithEvent: changeActiveAccount
  } = useAccountManager();

  const connectedAccountsToActiveTab = useSelector(
    selectConnectedAccountsWithOrigin
  );

  const accounts = useSelector(selectVaultAccounts);
  const activeAccount = useSelector(selectVaultActiveAccount);
  const targetAccount = targetAccountName
    ? accounts.find(account => account.name === targetAccountName)
    : activeAccount;

  const connectedAccountsListItems = connectedAccountsToActiveTab.map(
    account => ({
      ...account,
      id: account.name
    })
  );

  return (
    <ContentContainer>
      <ParagraphContainer gap="big">
        <SiteFaviconBadge origin={activeOrigin} />
        <VerticalSpaceContainer gap="medium">
          <Typography type="header">
            This account isn’t yet connected to this site
          </Typography>
        </VerticalSpaceContainer>
      </ParagraphContainer>
      {targetAccount && (
        <PageTile>
          <CentredFlexRow>
            <SvgIcon src="assets/icons/error.svg" color="contentYellow" />
            <SpaceBetweenContainer>
              <LeftAlignedFlexColumn>
                <Typography type="body">{targetAccount.name}</Typography>
                <Hash
                  value={targetAccount.publicKey}
                  variant={HashVariant.CaptionHash}
                  truncated
                />
              </LeftAlignedFlexColumn>
              <Button
                variant="inline"
                width="100"
                onClick={async () => {
                  await connectAccounts([targetAccount.name], activeOrigin);
                  navigate(RouterPath.Home);
                }}
              >
                <Trans t={t}>Connect</Trans>
              </Button>
            </SpaceBetweenContainer>
          </CentredFlexRow>
        </PageTile>
      )}
      <List
        headerLabel={t('Switch to another account')}
        rows={connectedAccountsListItems}
        renderRow={account => (
          <ListItemContainer key={account.name}>
            <SvgIcon
              src="assets/icons/checkbox-checked.svg"
              color="contentGreen"
            />

            <SpaceBetweenContainer>
              <LeftAlignedFlexColumn>
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
                  navigate(RouterPath.Home);
                }}
              >
                <Trans t={t}>Switch</Trans>
              </Button>
            </SpaceBetweenContainer>
          </ListItemContainer>
        )}
        marginLeftForItemSeparatorLine={60}
      />
    </ContentContainer>
  );
}
