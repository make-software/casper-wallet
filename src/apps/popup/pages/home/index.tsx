import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { PurposeForOpening, useWindowManager } from '@src/hooks';

import { ContentContainer } from '@layout/containers';
import {
  Button,
  Checkbox,
  Hash,
  HashVariant,
  SvgIcon,
  PageTile,
  Typography,
  List,
  ListItemActionContainer,
  ListItemContainer
} from '@libs/ui';

import { RouterPath, useTypedNavigate } from '@popup/router';

import {
  selectVaultAccounts,
  selectVaultActiveAccount
} from '@popup/redux/vault/selectors';
import { changeActiveAccount } from '@popup/redux/vault/actions';

// Account info

const CenteredFlexColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  width: 100%;

  margin-top: 16px;
  & + Button {
    margin-top: 24px;
  }
`;

const AvatarContainer = styled(CenteredFlexColumn)``;
const NameAndAddressContainer = styled(CenteredFlexColumn)``;
const BalanceContainer = styled(CenteredFlexColumn)``;

// List of accounts

const ListItemClickableContainer = styled.div`
  display: flex;
  flex-direction: row;

  width: 100%;
  height: 100%;

  cursor: pointer;

  padding-top: 14px;
  padding-bottom: 14px;
  padding-left: 18px;
  & > * + * {
    padding-left: 18px;
  }
`;

const LeftAlignedFlexColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const AccountBalanceListItemContainer = styled(LeftAlignedFlexColumn)``;
const AccountNameWithHashListItemContainer = styled(LeftAlignedFlexColumn)`
  width: 100%;
`;

const BalanceInCSPRsContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const ButtonsContainer = styled.div`
  display: flex;
  justify-content: space-around;
  gap: 16px;

  width: 100%;

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
        <PageTile>
          <AvatarContainer>
            <SvgIcon src="assets/icons/default-avatar.svg" size={120} />
          </AvatarContainer>
          <NameAndAddressContainer>
            <Typography type="body" weight="semiBold">
              {activeAccount.name}
            </Typography>
            <Hash
              value={activeAccount.publicKey}
              variant={HashVariant.CaptionHash}
              truncated
              withCopy
            />
          </NameAndAddressContainer>
          <BalanceContainer>
            <BalanceInCSPRsContainer>
              <Typography type="CSPR" weight="bold">
                2,133,493
              </Typography>
              <Typography type="CSPR" weight="light" color="contentSecondary">
                CSPR
              </Typography>
            </BalanceInCSPRsContainer>
            <Typography type="body" weight="regular" color="contentSecondary">
              $30,294.34
            </Typography>
          </BalanceContainer>
          <Button>Connect</Button>
        </PageTile>
      )}
      {accounts.length > 0 && (
        <List
          headerLabel={t('Accounts list')}
          rows={accounts}
          renderRow={account => (
            <ListItemContainer key={account.name}>
              <ListItemClickableContainer
                onClick={handleChangeActiveAccount(account.name)}
              >
                <Checkbox
                  checked={
                    activeAccount ? activeAccount.name === account.name : false
                  }
                />
                <AccountNameWithHashListItemContainer>
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
                    value={account.publicKey}
                    variant={HashVariant.CaptionHash}
                    truncated
                  />
                </AccountNameWithHashListItemContainer>

                <AccountBalanceListItemContainer>
                  <Typography type="body" weight="regular" monospace>
                    2.1M
                  </Typography>
                  <Typography
                    type="body"
                    weight="regular"
                    monospace
                    color="contentSecondary"
                  >
                    CSPR
                  </Typography>
                </AccountBalanceListItemContainer>
              </ListItemClickableContainer>
              <ListItemActionContainer
                onClick={() =>
                  navigate(
                    RouterPath.AccountSettings.replace(
                      ':accountName',
                      account.name
                    )
                  )
                }
              >
                <SvgIcon src="assets/icons/more.svg" size={24} />
              </ListItemActionContainer>
            </ListItemContainer>
          )}
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
      )}
    </ContentContainer>
  );
}
