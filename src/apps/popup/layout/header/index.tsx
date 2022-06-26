import React, { ReactElement, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { RouterPath } from '@popup/router';

import { HeaderContainer, LogoContainer, Logo } from '@src/layout';

import { MainmenuBar } from './mainmenu-bar';
import { SubmenuBar } from './submenu-bar';

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

  const activeAccountConnectionStatus = useMemo(() => {
    if (isActiveAccountConnectedToActiveTab === undefined) {
      return undefined;
    }
    return isActiveAccountConnectedToActiveTab ? 'Connected' : 'Disconnected';
  }, [isActiveAccountConnectedToActiveTab]);

  return (
    <>
      <HeaderContainer>
        <LogoContainer>
          <Logo onClick={() => navigate(RouterPath.Home)} />
        </LogoContainer>
        {activeAccountConnectionStatus}
        <MainmenuBar withMenu={withMenu} withLock={withLock} />
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
