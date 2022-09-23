import React from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { ContentContainer, HeaderTextContainer } from '@src/libs/layout';
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
  selectVaultActiveAccount,
  selectVaultActiveOrigin
} from '@src/background/redux/vault/selectors';
import { RouterPath, useTypedNavigate } from '@popup/router';
import { useAccountManager } from '@src/apps/popup/hooks/use-account-actions-with-events';

const HeaderTextContent = styled.div`
  margin-top: 16px;
`;

const CentredFlexRow = styled.div`
  display: flex;
  width: 100%;

  align-items: center;

  gap: 18px;
`;

const ListItemContainer = styled(CentredFlexRow)`
  padding: 14px 18px;
`;

const LeftAlignedFlexColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

export const SpaceBetweenContainer = styled(CentredFlexRow)`
  justify-content: space-between;
`;

export function ConnectAnotherAccountPageContent() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();
  const { accountName: targetAccountName } = useParams();

  const activeOrigin = useSelector(selectVaultActiveOrigin);
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
      <HeaderTextContainer>
        <SiteFaviconBadge origin={activeOrigin} />
        <HeaderTextContent>
          <Typography type="header">
            Your current account is not connected
          </Typography>
        </HeaderTextContent>
      </HeaderTextContainer>
      {targetAccount && (
        <PageTile>
          <CentredFlexRow>
            <SvgIcon
              src="assets/icons/error.svg"
              size={24}
              color="contentYellow"
            />
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
              size={24}
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
