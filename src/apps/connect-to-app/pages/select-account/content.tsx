import React, { useMemo, useCallback, SetStateAction, Dispatch } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import {
  Checkbox,
  SiteFaviconBadge,
  Hash,
  HashVariant,
  List,
  Typography
} from '@src/libs/ui';

import {
  PageContainer,
  ContentContainer,
  ParagraphContainer,
  ListItemClickableContainer,
  AccountNameWithHashListItemContainer,
  BreakWordContainer,
  VerticalSpaceContainer,
  SpacingSize
} from '@src/libs/layout';

import {
  selectConnectedAccountNamesWithOrigin,
  selectVaultAccounts,
  selectVaultActiveAccount
} from '@src/background/redux/vault/selectors';
import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import { useAccountsInfoList } from '@hooks/use-account-list-info/use-accounts-info-list';

// Hidden account balance until a solution for fetching many balances will be ready
// https://github.com/make-software/casper-wallet/issues/374
// const AccountBalanceListItemContainer = styled(LeftAlignedFlexColumn)``;

interface SelectAccountContentProps {
  selectedAccountNames: string[];
  setSelectedAccountNames: Dispatch<SetStateAction<string[]>>;
  origin: string;
  headerText: string;
}

export function SelectAccountContent({
  selectedAccountNames,
  setSelectedAccountNames,
  origin,
  headerText
}: SelectAccountContentProps) {
  const { t } = useTranslation();

  const activeAccount = useSelector(selectVaultActiveAccount);
  const accounts = useSelector(selectVaultAccounts);
  const connectedAccountNames = useSelector(
    selectConnectedAccountNamesWithOrigin
  );

  const notConnectedAccounts = accounts.filter(
    a => !connectedAccountNames.includes(a.name)
  );

  const handleSelectAll = useCallback(() => {
    setSelectedAccountNames(notConnectedAccounts.map(account => account.name));
  }, [notConnectedAccounts, setSelectedAccountNames]);

  const handleUnselectAll = useCallback(() => {
    setSelectedAccountNames([]);
  }, [setSelectedAccountNames]);

  const areAllAccountsSelected = notConnectedAccounts.every(account =>
    selectedAccountNames.includes(account.name)
  );

  const headerAction = useMemo(() => {
    const captionSelectAll = t('select all');
    const captionUnselectAll = t('unselect all');

    return areAllAccountsSelected
      ? { caption: captionUnselectAll, onClick: handleUnselectAll }
      : { caption: captionSelectAll, onClick: handleSelectAll };
  }, [t, areAllAccountsSelected, handleSelectAll, handleUnselectAll]);

  const accountsListItems = notConnectedAccounts.map(account => ({
    ...account,
    id: account.name,
    accountHash: getAccountHashFromPublicKey(account.publicKey)
  }));

  const { accountsInfoList } = useAccountsInfoList(accountsListItems);

  return (
    <PageContainer>
      <ContentContainer>
        <ParagraphContainer top={SpacingSize.Big}>
          <SiteFaviconBadge origin={origin} />
          <VerticalSpaceContainer top={SpacingSize.Medium}>
            <Typography type="header">
              <BreakWordContainer>{headerText}</BreakWordContainer>
            </Typography>
          </VerticalSpaceContainer>
        </ParagraphContainer>
        <List
          headerLabel={t('select account(s)')}
          headerAction={headerAction}
          rows={accountsInfoList}
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
                {account?.infoStandardName && (
                  <Typography type="bodyEllipsis">
                    {account.infoStandardName}
                  </Typography>
                )}
                <Hash
                  value={account.publicKey}
                  variant={HashVariant.CaptionHash}
                  truncated
                />
              </AccountNameWithHashListItemContainer>
              {/* Hidden account balance until a solution for fetching many balances will be ready */}
              {/*<AccountBalanceListItemContainer>*/}
              {/*  <Typography type="bodyHash">2.1M</Typography>*/}
              {/*  <Typography type="bodyHash" color="contentSecondary">*/}
              {/*    CSPR*/}
              {/*  </Typography>*/}
              {/*</AccountBalanceListItemContainer>*/}
            </ListItemClickableContainer>
          )}
          marginLeftForItemSeparatorLine={60}
        />
      </ContentContainer>
    </PageContainer>
  );
}
