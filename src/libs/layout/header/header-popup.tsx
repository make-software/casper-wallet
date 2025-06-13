import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import {
  selectIsActiveAccountConnectedWithActiveOrigin,
  selectVaultActiveAccount
} from '@background/redux/vault/selectors';

import { AlignedSpaceBetweenFlexRow, HeaderContainer } from '@libs/layout';
import { HeaderSigningAccount } from '@libs/layout/header/header-signing-account';
import { Account } from '@libs/types/account';
import { SvgIcon } from '@libs/ui/components';

import { HeaderActions } from './header-actions';
import { HeaderConnectionStatus } from './header-connection-status';
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
  signingAccount?: Account;
  renderSubmenuBarItems?: () => JSX.Element;
}

export function HeaderPopup({
  withNetworkSwitcher,
  withMenu,
  withConnectionStatus,
  signingAccount,
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
          <HeaderConnectionStatus
            publicKey={activeAccount.publicKey}
            isConnected={isActiveAccountConnected}
          />
        ) : signingAccount ? (
          <HeaderSigningAccount account={signingAccount} isConnected={true} />
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
