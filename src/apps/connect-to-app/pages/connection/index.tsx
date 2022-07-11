import React, { useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import styled from 'styled-components';

import { SvgIcon, Typography } from '@libs/ui';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectVaultAccounts,
  selectVaultActiveAccount,
  selectVaultIsLocked
} from '@popup/redux/vault/selectors';
import { useConnectAccount } from '@popup/hooks/use-connect-account';
import { closeWindow } from '@connect-to-app/utils/closeWindow';
import { sendActiveAccountChanged } from '@content/remote-actions';
import { useActiveTabOrigin } from '@src/hooks';
import { Account } from '@popup/redux/vault/types';
import { changeActiveAccount } from '@popup/redux/vault/actions';

const ContentContainer = styled.div`
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

  & > * {
    margin-right: 16px;
    & + * {
      margin-right: 8px;
      & + * {
        margin-right: 12px;
        & + * {
          margin-right: 12px;
          & + * {
            margin-right: 8px;
            & + * {
              margin-right: 16px;
              & + * {
                margin-right: 0;
              }
            }
          }
        }
      }
    }
  }
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

const SmallDot = styled.div`
  background-color: ${({ theme }) => theme.color.contentTertiary};
  width: 4px;
  height: 4px;
  border-radius: 4px;
`;

const BigDot = styled.div`
  background-color: ${({ theme }) => theme.color.contentTertiary};
  width: 6px;
  height: 6px;
  border-radius: 6px;
`;

function getNextActiveAccount(
  accounts: Account[],
  selectedAccountNames: string[],
  currentActiveAccount: Account | undefined
) {
  if (!currentActiveAccount) {
    return null;
  }

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

  return accounts
    .slice(0, currentActiveAccountIndex)
    .find(account => selectedAccountNames.includes(account.name));
}

interface ConnectionPageContentProps {
  selectedAccountNames: string[];
  faviconUrl: string;
  origin: string;
}

export function ConnectionPageContent({
  selectedAccountNames,
  faviconUrl,
  origin
}: ConnectionPageContentProps) {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const accounts = useSelector(selectVaultAccounts);
  const activeAccount = useSelector(selectVaultActiveAccount);
  const isLocked = useSelector(selectVaultIsLocked);
  const activeTabOrigin = useActiveTabOrigin({ currentWindow: false });

  const { connectAccount } = useConnectAccount({
    origin,
    currentWindow: false
  });

  useEffect(() => {
    if (
      accounts.length === 0 ||
      isLocked ||
      !origin ||
      selectedAccountNames.length === 0
    ) {
      return;
    }

    const nextActiveAccount = getNextActiveAccount(
      accounts,
      selectedAccountNames,
      activeAccount
    );

    selectedAccountNames.forEach(async (accountName, index, array) => {
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
  }, [activeTabOrigin]);

  return (
    <ContentContainer>
      <Typography type="header" weight="bold">
        <Trans t={t}>Connecting</Trans>
      </Typography>
      <IconsContainer>
        <LogoOverlay>
          <SvgIcon src="assets/icons/logo.svg" size={40} color="contentRed" />
        </LogoOverlay>

        <SmallDot />
        <BigDot />

        <SvgIcon src="assets/icons/lock.svg" size={24} />

        <BigDot />
        <SmallDot />

        <LogoOverlay>
          <AppLogoImg src={faviconUrl} alt="favicon" />
        </LogoOverlay>
      </IconsContainer>
    </ContentContainer>
  );
}
