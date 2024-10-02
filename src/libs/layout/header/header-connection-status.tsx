import React from 'react';
import { useSelector } from 'react-redux';

import {
  selectVaultAccountsPublicKeys,
  selectVaultActiveAccount
} from '@background/redux/vault/selectors';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import {
  AlignedFlexRow,
  LeftAlignedFlexColumn,
  SpacingSize
} from '@libs/layout';
import { HeaderBackgroundContainer } from '@libs/layout/header/components/header-background-container';
import { useFetchAccountsInfo } from '@libs/services/account-info';
import {
  AccountList,
  Avatar,
  Hash,
  HashVariant,
  Modal,
  Typography
} from '@libs/ui/components';

interface HeaderConnectionStatusProps {
  publicKey: string;
  isConnected: boolean;
}

export function HeaderConnectionStatus({
  publicKey,
  isConnected
}: HeaderConnectionStatusProps) {
  const activeAccount = useSelector(selectVaultActiveAccount);
  const accountsPublicKeys = useSelector(selectVaultAccountsPublicKeys);

  const accountsInfo = useFetchAccountsInfo(accountsPublicKeys);

  const accountHash = getAccountHashFromPublicKey(activeAccount?.publicKey);

  const csprName = accountsInfo && accountsInfo[accountHash]?.csprName;
  const brandingLogo = accountsInfo && accountsInfo[accountHash]?.brandingLogo;

  return (
    <Modal
      placement="top"
      renderContent={({ closeModal }) => (
        <AccountList closeModal={closeModal} />
      )}
      children={({ isOpen }) => (
        <AlignedFlexRow gap={SpacingSize.Tiny}>
          <HeaderBackgroundContainer isOpen={isOpen}>
            <Avatar
              size={36}
              publicKey={publicKey}
              withConnectedStatus
              isConnected={isConnected}
              displayContext="header"
              brandingLogo={brandingLogo}
              isAccountSwitcherOpen={isOpen}
              dataTestId="connection-status-modal"
            />
          </HeaderBackgroundContainer>
          <LeftAlignedFlexColumn
            style={{ cursor: 'auto' }}
            onClick={event => {
              event.stopPropagation();
            }}
          >
            <Typography type="bodySemiBold" color="contentOnFill">
              {activeAccount?.name}
            </Typography>
            <Hash
              value={activeAccount?.publicKey!}
              csprName={csprName}
              variant={HashVariant.CaptionHash}
              color="contentOnFill"
              truncated
              withCopyIcon
              placement="bottomRight"
              withOpacity
            />
          </LeftAlignedFlexColumn>
        </AlignedFlexRow>
      )}
    />
  );
}
