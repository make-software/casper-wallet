import React, { useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import styled from 'styled-components';

import { getFaviconUrlFromOrigin, SvgIcon, Typography } from '@libs/ui';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectVaultActiveAccount,
  selectVaultAccounts,
  selectVaultIsLocked
} from '@popup/redux/vault/selectors';
import { closeWindow } from '@connect-to-app/utils/closeWindow';
import { sendActiveAccountChanged } from '@content/remote-actions';
import { setActiveAccountName } from '@popup/redux/vault/actions';
import {
  getNextActiveAccount,
  useAccountManager
} from '@popup/hooks/use-account-manager';

const PageContainer = styled.div`
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

interface ConnectingPageProps {
  selectedAccountNames: string[];
  origin: string;
}

export function ConnectingPage({
  selectedAccountNames,
  origin
}: ConnectingPageProps) {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const accounts = useSelector(selectVaultAccounts);
  const activeAccount = useSelector(selectVaultActiveAccount);
  const isLocked = useSelector(selectVaultIsLocked);

  const { connectAccount } = useAccountManager({
    currentWindow: false
  });

  const faviconUrl = getFaviconUrlFromOrigin(origin);

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
      dispatch(setActiveAccountName(nextActiveAccount.name));
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
  }, [connectAccount]);

  return (
    <PageContainer>
      <Typography type="header" weight="bold">
        <Trans t={t}>Connecting</Trans>
      </Typography>
      <IconsContainer>
        <LogoOverlay>
          <SvgIcon src="assets/icons/logo.svg" size={40} color="contentRed" />
        </LogoOverlay>
        <SvgIcon src="assets/illustrations/connection.svg" size={76} />
        <LogoOverlay>
          {/* TODO: handle null-favicon-url case */}
          {faviconUrl && <AppLogoImg src={faviconUrl} alt="favicon" />}
        </LogoOverlay>
      </IconsContainer>
    </PageContainer>
  );
}
