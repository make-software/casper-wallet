import React, { useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import styled from 'styled-components';

import { SvgIcon, Typography } from '@libs/ui';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectVaultActiveAccount,
  selectVaultAccounts,
  selectVaultIsLocked
} from '@popup/redux/vault/selectors';
import { useConnectAccount } from '@popup/hooks/use-connect-account';
import { closeWindow } from '@connect-to-app/utils/closeWindow';
import { sendActiveAccountChanged } from '@content/remote-actions';
import { Account } from '@popup/redux/vault/types';
import { changeActiveAccount } from '@popup/redux/vault/actions';

const Page = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  height: 100%;
  width: 100%;
`;

const IconsContainer = styled.div`
  display: flex;
  align-items: center;

  margin-top: 32px;
  gap: 16px;
`;

const LogoOverlay = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  width: 80px;
  height: 80px;
  border-radius: 80px;

  background-color: ${({ theme }) => theme.color.contentOnFill};
`;

const AppLogoImg = styled.img`
  width: 40px;
  height: 40px;
`;

function getNextActiveAccount(
  accounts: Account[],
  selectedAccountNames: string[],
  currentActiveAccount: Account
) {
  if (selectedAccountNames.includes(currentActiveAccount.name)) {
    return currentActiveAccount;
  }

  const currentActiveAccountIndex = accounts.findIndex(
    account => account.name === currentActiveAccount.name
  );

  const nextAccountBelowCurrentActiveAccount = accounts
    .slice(currentActiveAccountIndex)
    .find(account => selectedAccountNames.includes(account.name));

  if (nextAccountBelowCurrentActiveAccount) {
    return nextAccountBelowCurrentActiveAccount;
  }

  // next account above current active account
  return accounts
    .slice(0, currentActiveAccountIndex)
    .find(account => selectedAccountNames.includes(account.name));
}

interface ConnectingPageProps {
  selectedAccountNames: string[];
  faviconUrl: string;
  origin: string;
}

export function ConnectingPage({
  selectedAccountNames,
  faviconUrl,
  origin
}: ConnectingPageProps) {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const accounts = useSelector(selectVaultAccounts);
  const activeAccount = useSelector(selectVaultActiveAccount);
  const isLocked = useSelector(selectVaultIsLocked);

  const { connectAccount } = useConnectAccount({
    origin,
    currentWindow: false
  });

  useEffect(() => {
    if (
      selectedAccountNames.length === 0 ||
      accounts.length === 0 ||
      !activeAccount ||
      isLocked ||
      !origin
    ) {
      return;
    }

    const nextActiveAccount = getNextActiveAccount(
      accounts,
      selectedAccountNames,
      activeAccount
    );

    selectedAccountNames.forEach(async accountName => {
      const account = accounts.find(account => account.name === accountName);

      if (account) {
        await connectAccount(account);
      }
    });

    if (nextActiveAccount) {
      dispatch(changeActiveAccount(nextActiveAccount.name));
      sendActiveAccountChanged(
        {
          isConnected: true,
          isUnlocked: !isLocked,
          activeKey: nextActiveAccount.publicKey
        },
        false
      ).then(() => {
        setTimeout(() => closeWindow(), 1000);
      });
    } else {
      setTimeout(() => closeWindow(), 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Page>
      <Typography type="header" weight="bold">
        <Trans t={t}>Connecting</Trans>
      </Typography>
      <IconsContainer>
        <LogoOverlay>
          <SvgIcon src="assets/icons/logo.svg" size={40} color="contentRed" />
        </LogoOverlay>
        <SvgIcon src="assets/illustrations/connection.svg" size={76} />
        <LogoOverlay>
          <AppLogoImg src={faviconUrl} alt="favicon" />
        </LogoOverlay>
      </IconsContainer>
    </Page>
  );
}
