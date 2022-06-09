import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { PurposeForOpening, useWindowManager } from '@src/hooks';

import { ContentContainer, TextContainer } from '@layout/containers';
import {
  Button,
  Checkbox,
  Hash,
  HashVariant,
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
import { changeActiveAccount } from '@popup/redux/vault/actions';

// Account info

const ActiveAccountDetailsContainer = styled.div`
  text-align: center;

  margin-top: 16px;
  padding-top: 24px;
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
              <Hash
                hash={activeAccount.publicKey}
                variant={HashVariant.CaptionHash}
                truncated
                withCopy
              />
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
                    <Hash
                      hash={account.publicKey}
                      variant={HashVariant.CaptionHash}
                      truncated
                    />
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
