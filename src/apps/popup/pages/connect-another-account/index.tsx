import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';
import { RootState } from 'typesafe-actions';
import styled from 'styled-components';

import { useActiveTabOrigin } from '@hooks/use-active-tab-origin';

import { ContentContainer, HeaderTextContainer } from '@src/layout';
import {
  Button,
  CurrentSiteFavicon,
  Hash,
  HashVariant,
  List,
  PageTile,
  SvgIcon,
  Typography
} from '@libs/ui';

import {
  selectConnectedAccountsToActiveTab,
  selectVaultAccounts,
  selectVaultActiveAccount,
  selectVaultIsLocked
} from '@popup/redux/vault/selectors';
import { RouterPath, useTypedNavigate } from '@popup/router';
import { changeActiveAccount } from '@popup/redux/vault/actions';
import { useConnectAccount } from '@popup/hooks/use-connect-account';
import { Account } from '@popup/redux/vault/types';
import { sendActiveAccountChangedToActiveTab } from '@content/remote-actions';

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
  const dispatch = useDispatch();
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const activeTabOrigin = useActiveTabOrigin({ currentWindow: true });

  const isLocked = useSelector(selectVaultIsLocked);
  const { connectAccount } = useConnectAccount({
    origin: activeTabOrigin,
    isLocked
  });

  const connectedAccountsToActiveTab = useSelector((state: RootState) =>
    selectConnectedAccountsToActiveTab(state, activeTabOrigin)
  );
  const accounts = useSelector(selectVaultAccounts);
  const activeAccount = useSelector(selectVaultActiveAccount);

  const handleConnectAccountToSite = useCallback(
    async (account: Account) => {
      await connectAccount(account);
      navigate(RouterPath.Home);
    },
    [navigate, connectAccount]
  );

  const handleSwitchToAccount = useCallback(
    (accountName: string) => {
      dispatch(changeActiveAccount(accountName));

      const nextAccount = accounts.find(
        account => account.name === accountName
      );

      if (nextAccount) {
        sendActiveAccountChangedToActiveTab(
          {
            isConnected: true,
            isUnlocked: !isLocked,
            activeKey: nextAccount.publicKey
          },
          true
        ).catch(e => console.error(e));
      }
      navigate(RouterPath.Home);
    },
    [dispatch, accounts, isLocked, navigate]
  );

  return (
    <ContentContainer>
      <HeaderTextContainer>
        <CurrentSiteFavicon
          faviconUrl={`${activeTabOrigin}/favicon.ico`}
          hostName={activeTabOrigin.split('://')[1]}
        />
        <HeaderTextContent>
          <Typography type="header" weight="bold">
            Your current account is not connected
          </Typography>
        </HeaderTextContent>
      </HeaderTextContainer>
      {activeAccount && (
        <PageTile>
          <CentredFlexRow>
            <SvgIcon
              src="assets/icons/error.svg"
              size={24}
              color="contentYellow"
            />
            <SpaceBetweenContainer>
              <LeftAlignedFlexColumn>
                <Typography type="body" weight="regular">
                  {activeAccount.name}
                </Typography>
                <Hash
                  value={activeAccount.publicKey}
                  variant={HashVariant.CaptionHash}
                  truncated
                />
              </LeftAlignedFlexColumn>
              <Button
                variant="inline"
                width="100"
                onClick={() => handleConnectAccountToSite(activeAccount)}
              >
                <Trans t={t}>Connect</Trans>
              </Button>
            </SpaceBetweenContainer>
          </CentredFlexRow>
        </PageTile>
      )}
      <List
        headerLabel={t('Switch to another account')}
        rows={connectedAccountsToActiveTab}
        renderRow={account => (
          <ListItemContainer key={account.name}>
            <SvgIcon
              src="assets/icons/checkbox-checked.svg"
              size={24}
              color="contentGreen"
            />

            <SpaceBetweenContainer>
              <LeftAlignedFlexColumn>
                <Typography type="body" weight="regular">
                  {account.name}
                </Typography>
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
                onClick={() => handleSwitchToAccount(account.name)}
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
