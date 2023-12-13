import React from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';

import {
  AlignedFlexRow,
  AlignedSpaceBetweenFlexRow,
  HeaderContainer
} from '@src/libs/layout';
import { Avatar, SvgIcon } from '@libs/ui';
import {
  selectIsActiveAccountConnectedWithActiveOrigin,
  selectVaultActiveAccount
} from '@background/redux/vault/selectors';

import { HeaderConnectionStatus } from './header-connection-status';
import { HeaderActions } from './header-actions';
import { HeaderDataUpdater } from './header-data-updater';

const SubmenuBarContainer = styled(AlignedSpaceBetweenFlexRow)`
  height: 56px;
  background-color: ${({ theme }) => theme.color.backgroundPrimary};
  border-bottom: 0.5px solid ${({ theme }) => theme.color.borderPrimary};
  padding: 8px ${({ theme }) => theme.padding[1.6]};
`;

interface HeaderProps {
  withNetworkSwitcher?: boolean;
  withMenu?: boolean;
  withConnectionStatus?: boolean;
  renderSubmenuBarItems?: () => JSX.Element;
}

export function PopupHeader({
  withNetworkSwitcher,
  withMenu,
  withConnectionStatus,
  renderSubmenuBarItems
}: HeaderProps) {
  const isActiveAccountConnected = useSelector(
    selectIsActiveAccountConnectedWithActiveOrigin
  );
  const activeAccount = useSelector(selectVaultActiveAccount);
  const headerDataUpdaterEnabled = Boolean(
    activeAccount?.publicKey &&
      (withMenu || withConnectionStatus || withNetworkSwitcher)
  );

  return (
    <>
      <HeaderContainer>
        {withConnectionStatus && activeAccount?.publicKey ? (
          <AlignedFlexRow>
            <Avatar
              size={32}
              publicKey={activeAccount.publicKey}
              withConnectedStatus
              isConnected={isActiveAccountConnected}
              displayContext="header"
            />
            <HeaderConnectionStatus />
          </AlignedFlexRow>
        ) : (
          <SvgIcon
            src="assets/icons/wallet-original-on-white.svg"
            width={113}
            height={28}
          />
        )}

        {(withMenu || withNetworkSwitcher) && (
          <HeaderActions
            withMenu={withMenu}
            withNetworkSwitcher={withNetworkSwitcher}
          />
        )}
      </HeaderContainer>
      {renderSubmenuBarItems && (
        <SubmenuBarContainer>{renderSubmenuBarItems()}</SubmenuBarContainer>
      )}
      {headerDataUpdaterEnabled && <HeaderDataUpdater />}
    </>
  );
}

export * from './header-submenu-bar-nav-link';
export * from './header-view-in-explorer';
