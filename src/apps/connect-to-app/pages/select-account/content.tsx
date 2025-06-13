import React, { Dispatch, SetStateAction, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import {
  selectConnectedAccountNamesWithActiveOrigin,
  selectVaultAccounts,
  selectVaultActiveAccount
} from '@background/redux/vault/selectors';

import {
  BreakWordContainer,
  ContentContainer,
  LeftAlignedFlexColumn,
  ListItemClickableContainer,
  PageContainer,
  ParagraphContainer,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import {
  Checkbox,
  Hash,
  HashVariant,
  List,
  SiteFaviconBadge,
  Typography
} from '@libs/ui/components';

const AccountNameWithHashListItemContainer = styled(LeftAlignedFlexColumn)`
  width: 100%;
`;

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
    selectConnectedAccountNamesWithActiveOrigin
  );

  const notConnectedAccounts = accounts.filter(
    account =>
      connectedAccountNames != null &&
      !connectedAccountNames.includes(account.name)
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

  const accountsListItems = accounts.map(account => ({
    ...account,
    id: account.name
  }));

  return (
    <PageContainer>
      <ContentContainer>
        <ParagraphContainer top={SpacingSize.XL}>
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
          rows={accountsListItems}
          headerLabelTop={SpacingSize.Large}
          contentTop={SpacingSize.Small}
          renderRow={(account, index) => {
            const isAccountAlreadyConnected = !!connectedAccountNames?.includes(
              account.name
            );
            const isAccountSelected = selectedAccountNames.includes(
              account.name
            );

            return (
              <ListItemClickableContainer
                onClick={
                  isAccountAlreadyConnected
                    ? undefined
                    : () =>
                        setSelectedAccountNames(selectedAccountNames =>
                          isAccountSelected
                            ? selectedAccountNames.filter(
                                accountName => accountName !== account.name
                              )
                            : [...selectedAccountNames, account.name]
                        )
                }
                isDisabled={isAccountAlreadyConnected}
              >
                <Checkbox
                  variant="square"
                  checked={isAccountSelected || isAccountAlreadyConnected}
                  disabled={isAccountAlreadyConnected}
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
                    label={t('Public key')}
                    value={account.publicKey}
                    variant={HashVariant.CaptionHash}
                    truncated
                    placement={
                      index === accountsListItems.length - 1
                        ? 'topRight'
                        : 'bottomRight'
                    }
                  />
                </AccountNameWithHashListItemContainer>
              </ListItemClickableContainer>
            );
          }}
          marginLeftForItemSeparatorLine={60}
        />
      </ContentContainer>
    </PageContainer>
  );
}
