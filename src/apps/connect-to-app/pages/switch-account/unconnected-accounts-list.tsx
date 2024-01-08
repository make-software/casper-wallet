import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { useAccountManager } from '@popup/hooks/use-account-actions-with-events';

import { closeCurrentWindow } from '@background/close-current-window';
import { selectActiveOrigin } from '@background/redux/active-origin/selectors';
import { AccountListRows } from '@background/redux/vault/types';
import { sendSdkResponseToSpecificTab } from '@background/send-sdk-response-to-specific-tab';

import { sdkMethod } from '@content/sdk-method';

import { LeftAlignedFlexColumn, SpacingSize } from '@libs/layout';
import {
  Button,
  ConnectionStatusBadge,
  Hash,
  HashVariant,
  List,
  Typography
} from '@libs/ui';

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
  requestId: string;
}

export const UnconnectedAccountsList = ({
  unconnectedAccountsList,
  requestId
}: UnconnectedAccountsListProps) => {
  const activeOrigin = useSelector(selectActiveOrigin);

  const { t } = useTranslation();
  const { connectAnotherAccountWithEvent: connectAnotherAccount } =
    useAccountManager();

  if (unconnectedAccountsList.length > 0) {
    return (
      <List
        headerLabel={t('Connect another account')}
        rows={unconnectedAccountsList}
        headerLabelTop={SpacingSize.Large}
        contentTop={SpacingSize.Small}
        renderRow={(unconnectedAccount, index) => (
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
                  placement={
                    index === unconnectedAccountsList.length - 1
                      ? 'topRight'
                      : 'bottomRight'
                  }
                />
              </LeftAlignedFlexColumn>
              <Button
                color="primaryRed"
                inline
                minWidth="86"
                onClick={async () => {
                  await connectAnotherAccount(
                    unconnectedAccount.name,
                    activeOrigin
                  );
                  await sendSdkResponseToSpecificTab(
                    sdkMethod.switchAccountResponse(false, { requestId })
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
