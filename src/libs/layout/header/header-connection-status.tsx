import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectVaultActiveAccount } from '@background/redux/vault/selectors';

import { AlignedFlexRow, SpacingSize } from '@libs/layout';
import {
  AccountList,
  Avatar,
  Hash,
  HashVariant,
  Modal,
  SvgIcon
} from '@libs/ui/components';
import { hexToRGBA } from '@libs/ui/utils';

const ConnectionStatusContainer = styled(AlignedFlexRow)`
  width: fit-content;

  background-color: ${({ theme }) => hexToRGBA(theme.color.black, '0.24')};
  padding: 6px 8px 6px 14px;
  border-top-right-radius: ${({ theme }) => theme.borderRadius.hundred}px;
  border-bottom-right-radius: ${({ theme }) => theme.borderRadius.hundred}px;

  position: relative;
  left: -2px;
`;

interface HeaderConnectionStatusProps {
  publicKey: string;
  isConnected: boolean;
}

export function HeaderConnectionStatus({
  publicKey,
  isConnected
}: HeaderConnectionStatusProps) {
  const activeAccount = useSelector(selectVaultActiveAccount);

  return (
    <Modal
      placement="top"
      dataTestId="connection-status-modal"
      renderContent={({ closeModal }) => (
        <AccountList closeModal={closeModal} />
      )}
      children={({ isOpen }) => (
        <>
          <Avatar
            size={32}
            publicKey={publicKey}
            withConnectedStatus
            isConnected={isConnected}
            displayContext="header"
          />
          <ConnectionStatusContainer gap={SpacingSize.Tiny}>
            <Hash
              value={activeAccount?.publicKey!}
              variant={HashVariant.ListSubtextHash}
              truncated
              withoutTooltip
              color="contentOnFill"
              withCopyOnSelfClick={false}
            />
            <SvgIcon
              size={16}
              src="assets/icons/chevron-up.svg"
              flipByAxis={isOpen ? undefined : 'X'}
              color="contentOnFill"
            />
          </ConnectionStatusContainer>
        </>
      )}
    />
  );
}
