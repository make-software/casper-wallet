import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { useAccountManager } from '@popup/hooks/use-account-actions-with-events';
import { SiteGroupHeader } from '@popup/pages/connected-sites/site-group-header';
import { SiteGroupItem } from '@popup/pages/connected-sites/site-group-item';

import {
  selectAccountsByOriginDict,
  selectSiteNameByOriginDict,
  selectVaultAccountsPublicKeys
} from '@background/redux/vault/selectors';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import {
  ContentContainer,
  IllustrationContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { useFetchAccountsInfo } from '@libs/services/account-info';
import { List, SvgIcon, Typography } from '@libs/ui/components';

export function ConnectedSitesPage() {
  const { t } = useTranslation();

  const {
    disconnectAccountWithEvent: disconnectAccount,
    disconnectSiteWithEvent: disconnectAllAccounts
  } = useAccountManager();

  const accountsByOrigin = useSelector(selectAccountsByOriginDict);
  const siteNameByOriginDict = useSelector(selectSiteNameByOriginDict);
  const publicKeys = useSelector(selectVaultAccountsPublicKeys);

  const isNoSitesConnected = !Object.entries(accountsByOrigin).length;

  const accountsInfo = useFetchAccountsInfo(publicKeys);

  if (isNoSitesConnected) {
    return (
      <ContentContainer>
        <IllustrationContainer>
          <SvgIcon
            src="assets/illustrations/no-connected-sites.svg"
            width={200}
            height={120}
          />
        </IllustrationContainer>
        <ParagraphContainer top={SpacingSize.XL}>
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
      <ParagraphContainer top={SpacingSize.XL}>
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
              const { name, publicKey, imported, hardware } = account;

              const accountHash = getAccountHashFromPublicKey(publicKey);

              const csprName =
                accountsInfo && accountsInfo[accountHash].csprName;

              return (
                <SiteGroupItem
                  key={name}
                  name={name}
                  publicKey={publicKey}
                  csprName={csprName}
                  imported={imported}
                  hardware={hardware}
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
