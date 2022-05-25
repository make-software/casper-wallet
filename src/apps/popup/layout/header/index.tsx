import React, { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';

import { RouterPath } from '@popup/router';

import { HeaderContainer, LogoContainer, Logo } from '@src/layout';

import { MainmenuBar } from './mainmenu-bar';
import { SubmenuBar } from './submenu-bar';

interface HeaderProps {
  withLock?: boolean;
  withMenu?: boolean;
  submenuActionType?: 'back' | 'close' | 'cancel';
  SubmenuActionBar?: ReactElement;
}

export function Header({
  withLock,
  withMenu,
  submenuActionType,
  SubmenuActionBar
}: HeaderProps) {
  const navigate = useNavigate();

  return (
    <>
      <HeaderContainer>
        <LogoContainer>
          <Logo onClick={() => navigate(RouterPath.Home)} />
        </LogoContainer>
        <MainmenuBar withMenu={withMenu} withLock={withLock} />
      </HeaderContainer>
      {submenuActionType && (
        <SubmenuBar
          actionType={submenuActionType}
          ActionBar={SubmenuActionBar}
        />
      )}
    </>
  );
}
