import React from 'react';
import styled from 'styled-components';

import LogoSVG from '@src/assets/icons/logo.svg';
import LogoBackgroundSVG from '@src/assets/icons/logo-background.svg';

const Container = styled.header`
  background: ${({ theme }) => theme.color.backgroundBlue};
  height: 72px;

  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const LogoBackground = styled(LogoBackgroundSVG)`
  position: absolute;
  top: 0;
  left: 0;
`;

const LogoContainer = styled.div`
  padding-left: 20px;
`;

const Logo = styled(LogoSVG)``;

export function Header() {
  return (
    <Container>
      <LogoContainer>
        <Logo />
        <LogoBackground />
      </LogoContainer>
    </Container>
  );
}
