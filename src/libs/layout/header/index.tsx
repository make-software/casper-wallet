import React from 'react';
import styled from 'styled-components';

import { HeaderContainer, Logo, LogoContainer } from '@src/libs/layout';
// import { HeaderConnectionStatus } from '@src/libs/layout/header/header-connection-status';

import { HeaderActions } from './header-actions';

const CentredFlexRow = styled.div`
  display: flex;
  width: 100%;

  align-items: center;
`;

const SpaceBetweenContainer = styled(CentredFlexRow)`
  justify-content: space-between;
  padding-left: 20px;
`;

interface HeaderProps {
  withLock?: boolean;
  withMenu?: boolean;
  renderActionGroup?: () => JSX.Element;
}

export function PopupHeader({
  withLock,
  withMenu,
  renderActionGroup
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
      {renderActionGroup && renderActionGroup()}
    </>
  );
}

export * from './header-submenu-bar';
