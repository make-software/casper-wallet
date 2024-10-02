import { IAccountInfo } from 'casper-wallet-core/src/domain/accountInfo';
import React from 'react';
import styled from 'styled-components';

import {
  AlignedSpaceBetweenFlexRow,
  FlexColumn,
  SpacingSize
} from '@libs/layout';
import {
  AccountListRowWithAccountHash,
  AccountListRows,
  HardwareWalletType
} from '@libs/types/account';
import {
  AccountActionsMenuPopover,
  Avatar,
  Hash,
  HashVariant,
  Typography
} from '@libs/ui/components';
import { formatNumber, motesToCSPR } from '@libs/ui/utils';

const ListItemContainer = styled(FlexColumn)`
  min-height: 68px;
  height: 100%;

  padding: 16px 8px 16px 16px;
`;

const ClickableContainer = styled(FlexColumn)`
  flex-grow: 1;

  cursor: ${({ onClick }) => (onClick ? 'pointer' : 'default')};
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
  account: AccountListRowWithAccountHash<AccountListRows>;
  onClick?: (
    event: React.MouseEvent<HTMLDivElement>,
    accountName: string
  ) => void;
  isConnected: boolean;
  isActiveAccount: boolean;
  showHideAccountItem?: boolean;
  closeModal?: (e: React.MouseEvent) => void;
  accountsInfo: Record<string, IAccountInfo> | undefined;
  accountLiquidBalance: string | undefined;
}

export const AccountListItem = ({
  account,
  onClick,
  isActiveAccount,
  isConnected,
  showHideAccountItem,
  closeModal,
  accountsInfo,
  accountLiquidBalance
}: AccountListItemProps) => {
  const accountBalance = accountLiquidBalance
    ? formatNumber(motesToCSPR(accountLiquidBalance), {
        precision: { max: 0 }
      })
    : '-';

  const csprName = accountsInfo && accountsInfo[account.accountHash]?.csprName;
  const brandingLogo =
    accountsInfo && accountsInfo[account.accountHash]?.brandingLogo;

  return (
    <ListItemContainer key={account.name}>
      <AlignedSpaceBetweenFlexRow gap={SpacingSize.Small}>
        <Avatar
          size={38}
          publicKey={account.publicKey}
          withConnectedStatus
          isConnected={isConnected}
          displayContext="accountList"
          isActiveAccount={isActiveAccount}
          brandingLogo={brandingLogo}
        />
        <ClickableContainer
          onClick={
            onClick
              ? event => {
                  onClick(event, account.name);
                }
              : undefined
          }
        >
          <AlignedSpaceBetweenFlexRow gap={SpacingSize.Small}>
            <AccountName type={isActiveAccount ? 'bodySemiBold' : 'body'}>
              {account.name}
            </AccountName>
            <Balance type="bodyHash" ellipsis loading={!accountLiquidBalance}>
              {accountBalance}
            </Balance>
          </AlignedSpaceBetweenFlexRow>
          <AlignedSpaceBetweenFlexRow>
            <Hash
              value={account.publicKey}
              csprName={csprName}
              variant={HashVariant.CaptionHash}
              truncated
              withoutTooltip
              isImported={account.imported}
              isLedger={account.hardware === HardwareWalletType.Ledger}
            />
            <Typography type="captionHash" color="contentSecondary">
              CSPR
            </Typography>
          </AlignedSpaceBetweenFlexRow>
        </ClickableContainer>
        <AccountActionsMenuPopover
          account={account}
          showHideAccountItem={showHideAccountItem}
          onClick={closeModal}
        />
      </AlignedSpaceBetweenFlexRow>
    </ListItemContainer>
  );
};
