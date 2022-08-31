import React from 'react';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';

import { List, Typography } from '@libs/ui';
import { ContentContainer, HeaderTextContainer } from '@src/libs/layout';

import { selectVaultAccountsByOriginDict } from '@src/background/redux/vault/selectors';

import { useAccountManager } from '@popup/hooks/use-account-manager';

import { SiteGroupHeader } from '@popup/pages/connected-sites/site-group-header';
import { SiteGroupItem } from '@popup/pages/connected-sites/site-group-item';

export function ConnectedSitesPage() {
  const { t } = useTranslation();

  const { disconnectAccount, disconnectAllAccounts } = useAccountManager();

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
