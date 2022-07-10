import React from 'react';
import { HeaderContainer, LogoContainer, Logo } from '@src/layout';
import { SubmenuBar } from './submenu-bar';

interface HeaderProps {
  submenuActionType?: 'back' | 'cancel';
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
