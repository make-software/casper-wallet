import React from 'react';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';

import { List, SvgIcon, Typography } from '@libs/ui';
import {
  ContentContainer,
  IllustrationContainer,
  ParagraphContainer,
  SpacingSize
} from '@src/libs/layout';

import {
  selectSiteNameByOriginDict,
  selectVaultAccountsByOriginDict
} from '@src/background/redux/vault/selectors';

import { useAccountManager } from '@src/apps/popup/hooks/use-account-actions-with-events';

import { SiteGroupHeader } from '@popup/pages/connected-sites/site-group-header';
import { SiteGroupItem } from '@popup/pages/connected-sites/site-group-item';

export function ConnectedSitesPage() {
  const { t } = useTranslation();

  const {
    disconnectAccountWithEvent: disconnectAccount,
    disconnectSiteWithEvent: disconnectAllAccounts
  } = useAccountManager();

  const accountsByOrigin = useSelector(selectVaultAccountsByOriginDict);
  const siteNameByOriginDict = useSelector(selectSiteNameByOriginDict);

  const isNoSitesConnected = !Object.entries(accountsByOrigin).length;

  if (isNoSitesConnected) {
    return (
      <ContentContainer>
        <IllustrationContainer>
          <SvgIcon
            src="assets/illustrations/no-connected-sites.svg"
            size={120}
          />
        </IllustrationContainer>
        <ParagraphContainer top={SpacingSize.ExtraLarge}>
          <Typography type="header">
            <Trans t={t}>No connected sites yet</Trans>
          </Typography>
        </ParagraphContainer>
        <ParagraphContainer top={SpacingSize.Medium}>
          <Typography type="body" color="contentSecondary">
            <Trans t={t}>
              When you connect an account to a site, the site and connected
              account will appear here.
            </Trans>
          </Typography>
        </ParagraphContainer>
      </ContentContainer>
    );
  }

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.ExtraLarge}>
        <Typography type="header">
          <Trans t={t}>Connected sites</Trans>
        </Typography>
      </ParagraphContainer>
      {Object.entries(accountsByOrigin).map(([origin, accounts], index) => {
        const siteOrigin = origin.split('://')[1];
        const siteTitle = siteNameByOriginDict[origin];

        return (
          <List
            key={origin + 'list'}
            rows={accounts.map(account => ({ ...account, id: account.name }))}
            renderHeader={() => (
              <SiteGroupHeader
                key={origin + 'header'}
                siteOrder={index + 1}
                siteTitle={siteTitle}
                siteOrigin={siteOrigin}
                disconnectSite={async () => {
                  await disconnectAllAccounts(origin);
                }}
              />
            )}
            renderRow={(account, index, array) => {
              const { name, publicKey, imported } = account;

              return (
                <SiteGroupItem
                  key={name}
                  name={name}
                  publicKey={publicKey}
                  imported={imported}
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
