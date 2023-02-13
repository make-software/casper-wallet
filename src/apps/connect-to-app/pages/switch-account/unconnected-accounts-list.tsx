import React from 'react';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { AccountListRows } from '@background/redux/vault/types';
import { closeCurrentWindow } from '@background/close-current-window';
import { selectActiveOrigin } from '@background/redux/session/selectors';

import { Button, Hash, HashVariant, List, Typography } from '@libs/ui';
import { LeftAlignedFlexColumn } from '@libs/layout';

import { ConnectionStatusBadge } from '@popup/pages/home/components/connection-status-badge';
import { useAccountManager } from '@popup/hooks/use-account-actions-with-events';

const CentredFlexRow = styled.div`
  display: flex;
  width: 100%;

  align-items: center;

  gap: 18px;
`;
export const ListItemContainer = styled(CentredFlexRow)`
  padding: 14px 18px;
`;

export const SpaceBetweenContainer = styled(CentredFlexRow)`
  justify-content: space-between;
`;

interface UnconnectedAccountsListProps {
  unconnectedAccountsList: AccountListRows[];
}

export const UnconnectedAccountsList = ({
  unconnectedAccountsList
}: UnconnectedAccountsListProps) => {
  const activeOrigin = useSelector(selectActiveOrigin);

  const { t } = useTranslation();
  const { connectAccountsWithEvent: connectAccounts } = useAccountManager();

  if (unconnectedAccountsList.length > 0) {
    return (
      <List
        headerLabel={t('Connect another account')}
        rows={unconnectedAccountsList}
        renderRow={unconnectedAccount => (
          <ListItemContainer key={unconnectedAccount.name}>
            <SpaceBetweenContainer>
              <LeftAlignedFlexColumn>
                <ConnectionStatusBadge
                  isConnected={false}
                  displayContext="accountList"
                />
                <Typography type="body">{unconnectedAccount.name}</Typography>
                <Hash
                  value={unconnectedAccount.publicKey}
                  variant={HashVariant.CaptionHash}
                  truncated
                />
              </LeftAlignedFlexColumn>
              <Button
                color="primaryRed"
                variant="inline"
                width="100"
                onClick={async () => {
                  await connectAccounts(
                    [unconnectedAccount.name],
                    activeOrigin
                  );
                  closeCurrentWindow();
                }}
              >
                <Trans t={t}>Connect</Trans>
              </Button>
            </SpaceBetweenContainer>
          </ListItemContainer>
        )}
        marginLeftForItemSeparatorLine={60}
      />
    );
  }

  return null;
};
