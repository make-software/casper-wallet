import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { PurposeForOpening, useWindowManager } from '@src/hooks';

import {
  ContentContainer,
  TextContainer,
  ButtonsContainer
} from '@src/layout/containers';
import {
  Button,
  Checkbox,
  List,
  ListContainer,
  ListItemElementContainer,
  MainContainer,
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
import { switchActiveAccount } from '@popup/redux/vault/actions';

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

  &:last-child ${MainContainer} {
    border-bottom: 1px solid ${({ theme }) => theme.color.borderPrimary};
  }
`;

const AccountDetailsListItemContainer = styled.div`
  display: flex;
  flex-direction: column;

  margin-top: 12px;
  margin-bottom: 12px;
`;

export function HomePageContent() {
  const dispatch = useDispatch();
  const navigate = useTypedNavigate();

  const { openWindow } = useWindowManager();

  const accounts = useSelector(selectVaultAccounts);
  const activeAccount = useSelector(selectVaultActiveAccount);

  const handleSwitchActiveAccount = useCallback(
    (name: string) => () => dispatch(switchActiveAccount(name)),
    [dispatch]
  );

  return (
    <ContentContainer>
      {activeAccount && (
        <Tile>
          <ActiveAccountDetailsContainer>
            <SvgIcon src="assets/icons/default-avatar.svg" size={120} />
            <TextContainer>
              <div>
                <Typography type="body" weight="semiBold">
                  {activeAccount.name}
                </Typography>
              </div>
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
          <Typography type="label" weight="medium" color="contentSecondary">
            Accounts list
          </Typography>

          <Tile>
            <List
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
                leftOnClick: handleSwitchActiveAccount(account.name),
                contentOnClick: handleSwitchActiveAccount(account.name),
                rightOnClick: () =>
                  navigate(
                    RouterPath.AccountSettings.replace(
                      ':accountName',
                      account.name
                    )
                  )
              }))}
            />
            <ButtonsContainer>
              <Button
                color="secondaryBlue"
                onClick={() =>
                  openWindow(PurposeForOpening.ImportAccount).catch(e =>
                    console.error(e)
                  )
                }
              >
                Import
              </Button>
              <Button color="secondaryBlue">Create</Button>
            </ButtonsContainer>
          </Tile>
        </AccountListContainer>
      )}
    </ContentContainer>
  );
}
