import React from 'react';
import { HeaderContainer, Logo, LogoContainer } from '@libs/layout';

export function HeaderWindowWithoutRouter() {
  return (
    <HeaderContainer>
      <LogoContainer>
        <Logo />
      </LogoContainer>
    </HeaderContainer>
  );
}
