import React from 'react';
import { HeaderContainer, LogoContainer, Logo } from '@src/libs/layout';
import { SubmenuBar_TO_BE_REMOVED } from './submenu-bar';

import { SubmenuActionType } from '../types';

interface HeaderProps {
  submenuActionType?: SubmenuActionType;
}

// should be removed as it's the same as Header, except it can be extended to be configured to fit this case
export function HeaderWindow_TO_BE_REMOVED({ submenuActionType }: HeaderProps) {
  return (
    <>
      <HeaderContainer>
        <LogoContainer>
          <Logo />
        </LogoContainer>
      </HeaderContainer>
      {submenuActionType && (
        <SubmenuBar_TO_BE_REMOVED actionType={submenuActionType} />
      )}
    </>
  );
}
