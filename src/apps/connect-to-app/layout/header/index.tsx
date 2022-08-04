import React from 'react';
import { HeaderContainer, LogoContainer, Logo } from '@src/layout';
import { SubmenuBar } from './submenu-bar';

import { SubmenuActionType } from './types';

interface HeaderProps {
  submenuActionType?: SubmenuActionType;
}

export function Header({ submenuActionType }: HeaderProps) {
  return (
    <>
      <HeaderContainer>
        <LogoContainer>
          <Logo />
        </LogoContainer>
      </HeaderContainer>
      {submenuActionType && <SubmenuBar actionType={submenuActionType} />}
    </>
  );
}
