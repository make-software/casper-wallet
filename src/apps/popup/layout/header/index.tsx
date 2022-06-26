import React, { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { RouterPath } from '@popup/router';

import { HeaderContainer, LogoContainer, Logo } from '@src/layout';

import { MainmenuBar } from './mainmenu-bar';
import { SubmenuBar } from './submenu-bar';
import { ConnectionStatus } from '@popup/layout/header/connection-status';

const CentredFlexRow = styled.div`
  display: flex;
  width: 100%;

  align-items: center;
`;

export const SpaceBetweenContainer = styled(CentredFlexRow)`
  justify-content: space-between;
  padding-left: 20px;
`;

interface HeaderProps {
  isActiveAccountConnectedToActiveTab?: boolean;
  withLock?: boolean;
  withMenu?: boolean;
  submenuActionType?: 'back' | 'close' | 'cancel';
  SubmenuActionGroup?: ReactElement;
}

export function Header({
  isActiveAccountConnectedToActiveTab,
  withLock,
  withMenu,
  submenuActionType,
  SubmenuActionGroup
}: HeaderProps) {
  const navigate = useNavigate();

  return (
    <>
      <HeaderContainer>
        <LogoContainer>
          <Logo onClick={() => navigate(RouterPath.Home)} />
        </LogoContainer>
        <SpaceBetweenContainer>
          <ConnectionStatus
            isConnected={isActiveAccountConnectedToActiveTab || false}
          />
          <MainmenuBar withMenu={withMenu} withLock={withLock} />
        </SpaceBetweenContainer>
      </HeaderContainer>
      {submenuActionType && (
        <SubmenuBar
          actionType={submenuActionType}
          ActionGroup={SubmenuActionGroup}
        />
      )}
    </>
  );
}
