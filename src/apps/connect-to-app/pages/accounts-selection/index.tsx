import React, { useMemo, useCallback, SetStateAction, Dispatch } from 'react';
import styled from 'styled-components';

import {
  Button,
  Checkbox,
  SiteFaviconBadge,
  Hash,
  HashVariant,
  List,
  Typography
} from '@libs/ui';

import {
  PageContainer,
  ContentContainer,
  HeaderTextContainer,
  ListItemClickableContainer,
  FooterButtonsContainer,
  LeftAlignedFlexColumn
} from '@src/libs/layout/containers';

import { useTranslation, Trans } from 'react-i18next';
import { useSelector } from 'react-redux';
import {
  selectVaultAccounts,
  selectVaultActiveAccount
} from '@src/background/redux/vault/selectors';

import { RouterPath, useTypedNavigate } from '@connect-to-app/router';

const HeaderTextContent = styled.div`
  margin-top: 16px;
`;

const TextCentredContainer = styled.div`
  text-align: center;
`;

const AccountBalanceListItemContainer = styled(LeftAlignedFlexColumn)``;
const AccountNameWithHashListItemContainer = styled(LeftAlignedFlexColumn)`
  width: 100%;
`;

interface AccountsSelectionPageProps {
  selectedAccountNames: string[];
  setSelectedAccountNames: Dispatch<SetStateAction<string[]>>;
  origin: string;
  headerText: string;
}

export function AccountsSelectionPage({
  selectedAccountNames,
  setSelectedAccountNames,
  origin,
  headerText
}: AccountsSelectionPageProps) {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const accounts = useSelector(selectVaultAccounts);
  const activeAccount = useSelector(selectVaultActiveAccount);

  const handleSelectAll = useCallback(() => {
    setSelectedAccountNames(accounts.map(account => account.name));
  }, [accounts, setSelectedAccountNames]);

  const handleUnselectAll = useCallback(() => {
    setSelectedAccountNames([]);
  }, [setSelectedAccountNames]);

  const areAllAccountsSelected = accounts.every(account =>
    selectedAccountNames.includes(account.name)
  );

  const headerAction = useMemo(() => {
    const captionSelectAll = t('select all');
    const captionUnselectAll = t('unselect all');

    return areAllAccountsSelected
      ? { caption: captionUnselectAll, onClick: handleUnselectAll }
      : { caption: captionSelectAll, onClick: handleSelectAll };
  }, [t, areAllAccountsSelected, handleSelectAll, handleUnselectAll]);

  const accountsListItems = accounts.map(account => ({
    ...account,
    id: account.name
  }));

  return (
    <PageContainer>
      <ContentContainer>
        <HeaderTextContainer>
          <SiteFaviconBadge origin={origin} />
          <HeaderTextContent>
            <Typography type="header">
              <Trans t={t}>{headerText}</Trans>
            </Typography>
          </HeaderTextContent>
        </HeaderTextContainer>
        <List
          headerLabel={t('select account(s)')}
          headerAction={headerAction}
          rows={accountsListItems}
          renderRow={account => (
            <ListItemClickableContainer
              onClick={() =>
                setSelectedAccountNames(selectedAccountNames =>
                  selectedAccountNames.includes(account.name)
                    ? selectedAccountNames.filter(
                        accountName => accountName !== account.name
                      )
                    : [...selectedAccountNames, account.name]
                )
              }
            >
              <Checkbox
                variant="square"
                checked={selectedAccountNames.includes(account.name)}
              />
              <AccountNameWithHashListItemContainer>
                <Typography
                  type={
                    activeAccount && activeAccount.name === account.name
                      ? 'bodySemiBold'
                      : 'body'
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
                <Typography type="bodyHash">2.1M</Typography>
                <Typography type="bodyHash" color="contentSecondary">
                  CSPR
                </Typography>
              </AccountBalanceListItemContainer>
            </ListItemClickableContainer>
          )}
          marginLeftForItemSeparatorLine={60}
        />
      </ContentContainer>
      <FooterButtonsContainer>
        <TextCentredContainer>
          <Typography type="captionRegular">
            <Trans t={t}>Only connect with sites you trust</Trans>
          </Typography>
        </TextCentredContainer>
        <Button
          disabled={selectedAccountNames.length === 0}
          onClick={() => navigate(RouterPath.ApproveConnection)}
        >
          <Trans t={t}>Next</Trans>
        </Button>
      </FooterButtonsContainer>
    </PageContainer>
  );
}
