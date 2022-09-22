import React from 'react';
import styled from 'styled-components';

import {
  HeaderContainer,
  Logo,
  LogoContainer,
  CenteredSpaceBetweenFlexRow
} from '@src/libs/layout';
// import { HeaderConnectionStatus } from '@src/libs/layout/header/header-connection-status';

import { HeaderActions } from './header-actions';

const SpaceBetweenContainer = styled(CenteredSpaceBetweenFlexRow)`
  width: 100%;
  padding-left: 20px;
`;

const SubmenuBarContainer = styled(CenteredSpaceBetweenFlexRow)`
  height: 56px;
  background-color: ${({ theme }) => theme.color.backgroundPrimary};
  border-bottom: 0.5px solid ${({ theme }) => theme.color.borderPrimary};
  padding: 8px ${({ theme }) => theme.padding[1.6]};
`;

interface HeaderProps {
  withLock?: boolean;
  withMenu?: boolean;
  renderSubmenuBarItems?: () => JSX.Element;
}

export function PopupHeader({
  withLock,
  withMenu,
  renderSubmenuBarItems
}: HeaderProps) {
  return (
    <>
      <HeaderContainer>
        <LogoContainer>
          <Logo />
        </LogoContainer>
        <SpaceBetweenContainer>
          {/* <HeaderConnectionStatus /> */}
          <HeaderActions withMenu={withMenu} withLock={withLock} />
        </SpaceBetweenContainer>
      </HeaderContainer>
      {renderSubmenuBarItems && (
        <SubmenuBarContainer>{renderSubmenuBarItems()}</SubmenuBarContainer>
      )}
    </>
  );
}

export * from './header-submenu-bar-nav-link';
