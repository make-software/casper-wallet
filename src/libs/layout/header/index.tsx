import React, { ReactElement } from 'react';
import styled from 'styled-components';

import { HeaderContainer, Logo, LogoContainer } from '@src/libs/layout';
// import { HeaderConnectionStatus } from '@src/libs/layout/header/header-connection-status';

import { HeaderActions } from './header-actions';
import { HeaderSubmenuBar } from './header-submenu-bar';
import { SubmenuActionType } from '../types';

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
  submenuActionType?: SubmenuActionType;
  SubmenuActionGroup?: ReactElement;
}

export function PopupHeader({
  withLock,
  withMenu,
  submenuActionType,
  SubmenuActionGroup
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
      {submenuActionType && (
        <HeaderSubmenuBar
          actionType={submenuActionType}
          ActionGroup={SubmenuActionGroup}
        />
      )}
    </>
  );
}
