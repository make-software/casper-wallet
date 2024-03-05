import React from 'react';
import styled from 'styled-components';

import {
  AlignedFlexRow,
  AlignedSpaceBetweenFlexRow,
  FlexColumn,
  LeftAlignedFlexColumn,
  SpacingSize
} from '@libs/layout';
import { AccountListRows } from '@libs/types/account';
import {
  AccountActionsMenuPopover,
  Avatar,
  Hash,
  HashVariant,
  Typography
} from '@libs/ui/components';

const ListItemContainer = styled(FlexColumn)`
  min-height: 68px;
  height: 100%;

  padding: 16px 8px 16px 16px;
`;

const ListItemClickableContainer = styled(AlignedFlexRow)`
  cursor: ${({ onClick }) => (onClick ? 'pointer' : 'default')};
  width: ${({ onClick }) => (onClick ? '100%' : 'auto')};
`;

interface AccountListItemProps {
  account: AccountListRows;
  onClick?: (
    event: React.MouseEvent<HTMLDivElement>,
    accountName: string
  ) => void;
  isConnected: boolean;
  isActiveAccount: boolean;
  showHideAccountItem?: boolean;
  closeModal?: (e: React.MouseEvent) => void;
}

export const AccountListItem = ({
  account,
  onClick,
  isActiveAccount,
  isConnected,
  showHideAccountItem,
  closeModal
}: AccountListItemProps) => (
  <ListItemContainer key={account.name}>
    <AlignedSpaceBetweenFlexRow>
      <ListItemClickableContainer
        gap={SpacingSize.Medium}
        onClick={
          onClick
            ? event => {
                onClick(event, account.name);
              }
            : undefined
        }
      >
        <Avatar
          size={38}
          publicKey={account.publicKey}
          withConnectedStatus
          isConnected={isConnected}
          displayContext="accountList"
          isActiveAccount={isActiveAccount}
        />
        <LeftAlignedFlexColumn>
          <Typography type={isActiveAccount ? 'bodySemiBold' : 'body'}>
            {account.name}
          </Typography>
          <Hash
            value={account.publicKey}
            variant={HashVariant.CaptionHash}
            truncated
            withoutTooltip
            withTag={account.imported}
          />
        </LeftAlignedFlexColumn>
      </ListItemClickableContainer>
      <AccountActionsMenuPopover
        account={account}
        showHideAccountItem={showHideAccountItem}
        onClick={closeModal}
      />
    </AlignedSpaceBetweenFlexRow>
  </ListItemContainer>
);
