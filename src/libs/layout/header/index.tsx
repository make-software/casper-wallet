import React from 'react';
import styled from 'styled-components';

import {
  HeaderContainer,
  Logo,
  LogoContainer,
  AlignedSpaceBetweenFlexRow,
  LeftAlignedCenteredFlexRow
} from '@src/libs/layout';
import { HeaderConnectionStatus } from '@src/libs/layout/header/header-connection-status';

import { HeaderActions } from './header-actions';

const LogoAndConnectionStatusContainer = styled(LeftAlignedCenteredFlexRow)`
  gap: 18px;
`;

const SubmenuBarContainer = styled(AlignedSpaceBetweenFlexRow)`
  height: 56px;
  background-color: ${({ theme }) => theme.color.backgroundPrimary};
  border-bottom: 0.5px solid ${({ theme }) => theme.color.borderPrimary};
  padding: 8px ${({ theme }) => theme.padding[1.6]};
`;

interface HeaderProps {
  withLock?: boolean;
  withMenu?: boolean;
  withConnectionStatus?: boolean;
  renderSubmenuBarItems?: () => JSX.Element;
}

export function PopupHeader({
  withLock,
  withMenu,
  withConnectionStatus,
  renderSubmenuBarItems
}: HeaderProps) {
  return (
    <>
      <HeaderContainer>
        <LogoAndConnectionStatusContainer>
          <LogoContainer>
            <Logo />
          </LogoContainer>
          {withConnectionStatus && <HeaderConnectionStatus />}
        </LogoAndConnectionStatusContainer>

        {(withMenu || withLock) && (
          <HeaderActions withMenu={withMenu} withLock={withLock} />
        )}
      </HeaderContainer>
      {renderSubmenuBarItems && (
        <SubmenuBarContainer>{renderSubmenuBarItems()}</SubmenuBarContainer>
      )}
    </>
  );
}

export * from './header-submenu-bar-nav-link';
