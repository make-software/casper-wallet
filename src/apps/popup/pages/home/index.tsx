import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation, Trans } from 'react-i18next';
import styled from 'styled-components';

import { PurposeForOpening, useWindowManager } from '@src/hooks';

import { ContentContainer, TextContainer } from '@src/layout/containers';
import {
  Button,
  Checkbox,
  List,
  ListContainer,
  ListItemElementContainer,
  SvgIcon,
  Tile,
  Typography
} from '@libs/ui';

import { RouterPath, useTypedNavigate } from '@popup/router';

import {
  selectVaultAccounts,
  selectVaultActiveAccount
} from '@popup/redux/vault/selectors';
import { truncateKey } from '@popup/pages/home/utils';
import { changeActiveAccount } from '@popup/redux/vault/actions';

// Account info

const ActiveAccountDetailsContainer = styled.div`
  text-align: center;

  margin-top: 16px;
  padding-top: 24px;
`;

const AccountPublicKeyContainer = styled.div`
  display: flex;
  justify-content: center;

  & > span {
    line-height: 24px;
    cursor: pointer;
  }
`;

// List of accounts

const AccountListContainer = styled.div`
  margin-top: 20px;

  & ${ListContainer} {
    margin-top: 12px;
    margin-bottom: 16px;
  }
`;

const AccountDetailsListItemContainer = styled.div`
  display: flex;
  flex-direction: column;

  margin-top: 12px;
  margin-bottom: 12px;
`;

const ButtonsContainer = styled.div`
  width: 100%;

  display: flex;
  justify-content: space-around;
  gap: 16px;

  padding: ${({ theme }) => theme.padding[1.6]};
`;

export function HomePageContent() {
  const dispatch = useDispatch();
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const { openWindow } = useWindowManager();

  const accounts = useSelector(selectVaultAccounts);
  const activeAccount = useSelector(selectVaultActiveAccount);

  const handleChangeActiveAccount = useCallback(
    (name: string) => () => dispatch(changeActiveAccount(name)),
    [dispatch]
  );

  return (
    <ContentContainer>
      {activeAccount && (
        <Tile>
          <ActiveAccountDetailsContainer>
            <SvgIcon src="assets/icons/default-avatar.svg" size={120} />
            <TextContainer>
              <Typography type="body" weight="semiBold">
                {activeAccount.name}
              </Typography>
              <AccountPublicKeyContainer>
                <Typography
                  type="hash"
                  weight="regular"
                  color="contentSecondary"
                  onClick={() =>
                    navigator.clipboard.writeText(activeAccount.publicKey)
                  }
                >
                  {truncateKey(activeAccount.publicKey)}
                </Typography>
                <SvgIcon
                  src="assets/icons/copy.svg"
                  size={24}
                  onClick={() =>
                    navigator.clipboard.writeText(activeAccount.publicKey)
                  }
                />
              </AccountPublicKeyContainer>
            </TextContainer>
          </ActiveAccountDetailsContainer>
        </Tile>
      )}
      {accounts.length > 0 && (
        <AccountListContainer>
          <List
            headerLabel={t('Accounts list')}
            listItems={accounts.map(account => ({
              id: account.name,
              Left: (
                <ListItemElementContainer>
                  <Checkbox
                    checked={
                      activeAccount
                        ? activeAccount.name === account.name
                        : false
                    }
                  />
                </ListItemElementContainer>
              ),
              Content: (
                <ListItemElementContainer>
                  <AccountDetailsListItemContainer>
                    <Typography
                      type="body"
                      weight={
                        activeAccount && activeAccount.name === account.name
                          ? 'semiBold'
                          : 'regular'
                      }
                    >
                      {account.name}
                    </Typography>
                    <Typography
                      type="hash"
                      weight="regular"
                      color="contentSecondary"
                    >
                      {truncateKey(account.publicKey)}
                    </Typography>
                  </AccountDetailsListItemContainer>
                </ListItemElementContainer>
              ),
              Right: (
                <ListItemElementContainer>
                  <SvgIcon src="assets/icons/more.svg" size={24} />
                </ListItemElementContainer>
              ),
              leftOnClick: handleChangeActiveAccount(account.name),
              contentOnClick: handleChangeActiveAccount(account.name),
              rightOnClick: () =>
                navigate(
                  RouterPath.AccountSettings.replace(
                    ':accountName',
                    account.name
                  )
                )
            }))}
            renderFooter={() => (
              <ButtonsContainer>
                <Button
                  color="secondaryBlue"
                  onClick={() =>
                    openWindow(PurposeForOpening.ImportAccount).catch(e =>
                      console.error(e)
                    )
                  }
                >
                  <Trans t={t}>Import</Trans>
                </Button>
                <Button color="secondaryBlue">
                  <Trans t={t}>Create</Trans>
                </Button>
              </ButtonsContainer>
            )}
          />
        </AccountListContainer>
      )}
    </ContentContainer>
  );
}
