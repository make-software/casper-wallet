import React from 'react';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';

import { List, Typography } from '~src/libs/ui';
import { ContentContainer, HeaderTextContainer } from '~src/libs/layout';

import { selectVaultAccountsByOriginDict } from '~src/libs/redux/vault/selectors';

import { useAccountManager } from '~src/apps/popup/hooks/use-account-actions-with-events';

import { SiteGroupHeader } from '~src/apps/popup/pages/connected-sites/site-group-header';
import { SiteGroupItem } from '~src/apps/popup/pages/connected-sites/site-group-item';

export function ConnectedSitesPage() {
  const { t } = useTranslation();

  const {
    disconnectAccountWithEvent: disconnectAccount,
    disconnectAllAccountsWithEvent: disconnectAllAccounts
  } = useAccountManager();

  const accountsByOrigin = useSelector(selectVaultAccountsByOriginDict);

  return (
    <ContentContainer>
      <HeaderTextContainer>
        <Typography type="header" weight="bold">
          <Trans t={t}>Connected sites</Trans>
        </Typography>
      </HeaderTextContainer>
      {Object.entries(accountsByOrigin).map(([origin, accounts], index) => {
        const siteTitle = origin.split('://')[1];
        return (
          <List
            key={origin + 'list'}
            rows={accounts.map(account => ({ ...account, id: account.name }))}
            renderHeader={() => (
              <SiteGroupHeader
                key={origin + 'header'}
                siteTitle={siteTitle}
                disconnectSite={async () => {
                  await disconnectAllAccounts(origin);
                }}
              />
            )}
            renderRow={(account, index, array) => {
              const { name, publicKey } = account;

              return (
                <SiteGroupItem
                  key={name}
                  name={name}
                  publicKey={publicKey}
                  handleOnClick={async () => {
                    if (array == null || array.length === 0) {
                      return;
                    }

                    await disconnectAccount(name, origin);
                  }}
                />
              );
            }}
            marginLeftForItemSeparatorLine={16}
          />
        );
      })}
    </ContentContainer>
  );
}
