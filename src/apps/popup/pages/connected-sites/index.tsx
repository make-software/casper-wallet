import React from 'react';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { Hash, HashVariant, List, Typography } from '@libs/ui';
import { ContentContainer, HeaderTextContainer } from '@src/layout';

import {
  AccountNamesAndPublicKeys,
  selectAccountNamesAndPublicKeysByOrigin
} from '@popup/redux/vault/selectors';

import { useAccountManager } from '@popup/hooks/use-account-manager';

import { SiteControls } from '@popup/pages/connected-sites/site-controls';

const CentredFlexRow = styled.div`
  display: flex;
  width: 100%;

  align-items: center;

  gap: 18px;
`;

const ListItemContainer = styled(CentredFlexRow)`
  padding: 12px 16px;
`;

const AccountNameAndPublicKeyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

interface SiteOriginListRow {
  id: string;
  origin: string;
}

export function ConnectedSitesPage() {
  const { t } = useTranslation();

  const { disconnectAllAccounts } = useAccountManager({
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
          renderRow={(row, index) => {
            if (index === 0) {
              const { id, origin } = row as SiteOriginListRow;
              const siteTitle = origin.split('://')[1];

              return (
                <SiteControls
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
              <ListItemContainer key={id}>
                <AccountNameAndPublicKeyContainer>
                  <Typography type="body" weight="regular">
                    {name}
                  </Typography>
                  <Hash
                    variant={HashVariant.CaptionHash}
                    value={publicKey}
                    truncated
                  />
                </AccountNameAndPublicKeyContainer>
              </ListItemContainer>
            );
          }}
          marginLeftForItemSeparatorLine={16}
        />
      ))}
    </ContentContainer>
  );
}
