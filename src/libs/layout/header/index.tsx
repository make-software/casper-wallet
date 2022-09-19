import React, { ReactElement } from 'react';
import styled from 'styled-components';

import { HeaderContainer, Logo, LogoContainer } from '@src/libs/layout';
import { HeaderConnectionStatus } from '@src/libs/layout/header/header-connection-status';

import { HeaderActions } from './header-actions';
import { HeaderSubmenuBar } from './header-submenu-bar';
import { SubmenuActionType } from '../types';

const LeftAlignedContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
`;

const LogoAndConnectionStatusContainer = styled(LeftAlignedContainer)`
  gap: 18px;
`;

interface HeaderProps {
  withLock?: boolean;
  withMenu?: boolean;
  withConnectionStatus?: boolean;
  submenuActionType?: SubmenuActionType;
  SubmenuActionGroup?: ReactElement;
}

export function PopupHeader({
  withLock,
  withMenu,
  withConnectionStatus,
  submenuActionType,
  SubmenuActionGroup
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

        <HeaderActions withMenu={withMenu} withLock={withLock} />
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
