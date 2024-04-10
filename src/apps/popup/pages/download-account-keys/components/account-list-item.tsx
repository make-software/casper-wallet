import React from 'react';
import styled from 'styled-components';

import {
  AlignedSpaceBetweenFlexRow,
  FlexColumn,
  SpacingSize
} from '@libs/layout';
import { AccountListRows } from '@libs/types/account';
import {
  Avatar,
  Checkbox,
  Hash,
  HashVariant,
  Typography
} from '@libs/ui/components';
import { formatNumber, motesToCSPR } from '@libs/ui/utils';

const ListItemContainer = styled(FlexColumn)`
  min-height: 68px;
  height: 100%;

  padding: 16px;

  cursor: pointer;
`;

const Balance = styled(Typography)`
  min-width: 0;
  flex-grow: 1;
  flex-basis: auto;
  text-align: right;
`;

const AccountName = styled(Typography)`
  flex-shrink: 0;
`;

interface AccountListItemProps {
  account: AccountListRows;
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  isConnected: boolean;
  isActiveAccount: boolean;
  isSelected?: boolean;
}

export const AccountListItem = ({
  account,
  onClick,
  isActiveAccount,
  isConnected,
  isSelected
}: AccountListItemProps) => {
  const accountBalance =
    account.balance?.liquidMotes != null
      ? formatNumber(motesToCSPR(account.balance.liquidMotes), {
          precision: { max: 0 }
        })
      : '-';

  return (
    <ListItemContainer key={account.name} onClick={onClick}>
      <AlignedSpaceBetweenFlexRow gap={SpacingSize.Medium}>
        <Avatar
          size={38}
          publicKey={account.publicKey}
          withConnectedStatus
          isConnected={isConnected}
          displayContext="accountList"
          isActiveAccount={isActiveAccount}
        />
        <FlexColumn flexGrow={1}>
          <AlignedSpaceBetweenFlexRow gap={SpacingSize.Small}>
            <AccountName type={isActiveAccount ? 'bodySemiBold' : 'body'}>
              {account.name}
            </AccountName>
            <Balance
              type="bodyHash"
              ellipsis
              loading={!account.balance && account.balance !== 0}
            >
              {accountBalance}
            </Balance>
          </AlignedSpaceBetweenFlexRow>
          <AlignedSpaceBetweenFlexRow>
            <Hash
              value={account.publicKey}
              variant={HashVariant.CaptionHash}
              truncated
              withoutTooltip
              withTag={account.imported}
            />
            <Typography type="captionHash" color="contentSecondary">
              CSPR
            </Typography>
          </AlignedSpaceBetweenFlexRow>
        </FlexColumn>
        <Checkbox checked={!!isSelected} variant="square" />
      </AlignedSpaceBetweenFlexRow>
    </ListItemContainer>
  );
};
