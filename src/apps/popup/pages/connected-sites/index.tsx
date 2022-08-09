import React from 'react';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';

import { List, Typography } from '@libs/ui';
import { ContentContainer, HeaderTextContainer } from '@src/layout';

import {
  AccountNamesAndPublicKeys,
  selectAccountNamesAndPublicKeysByOrigin
} from '@popup/redux/vault/selectors';

import { useAccountManager } from '@popup/hooks/use-account-manager';

import { SiteGroupHeader } from '@popup/pages/connected-sites/site-group-header';
import { SiteGroupItem } from '@popup/pages/connected-sites/site-group-item';

interface SiteOriginListRow {
  id: string;
  origin: string;
}

export function ConnectedSitesPage() {
  const { t } = useTranslation();

  const { disconnectAccount, disconnectAllAccounts } = useAccountManager({
    currentWindow: true
  });

  const accountNamesAndPublicKeysByOrigin = useSelector(
    selectAccountNamesAndPublicKeysByOrigin
  );

  const lists = Object.entries(accountNamesAndPublicKeysByOrigin).map(
    ([origin, accountNamesAndPublicKeys]) => [
      { id: origin, origin },
      ...accountNamesAndPublicKeys
    ]
  );

  return (
    <ContentContainer>
      <HeaderTextContainer>
        <Typography type="header" weight="bold">
          <Trans t={t}>Connected sites</Trans>
        </Typography>
      </HeaderTextContainer>
      {lists.map(rows => (
        <List
          key={rows[0].id}
          rows={rows}
          renderRow={(row, index, array) => {
            if (index === 0) {
              const { id, origin } = row as SiteOriginListRow;
              const siteTitle = origin.split('://')[1];

              return (
                <SiteGroupHeader
                  key={id}
                  siteTitle={siteTitle}
                  disconnectSite={async () => {
                    await disconnectAllAccounts(origin);
                  }}
                />
              );
            }
            const { id, name, publicKey } = row as AccountNamesAndPublicKeys;

            return (
              <SiteGroupItem
                id={id}
                name={name}
                publicKey={publicKey}
                handleOnClick={async () => {
                  if (array == null || array.length === 0) {
                    return;
                  }

                  const { origin } = array[0] as SiteOriginListRow;
                  await disconnectAccount(name, origin);
                }}
              />
            );
          }}
          marginLeftForItemSeparatorLine={16}
        />
      ))}
    </ContentContainer>
  );
}
