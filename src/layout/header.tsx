import React from 'react';
import styled from 'styled-components';

import { SvgIcon } from '@src/libs/ui';

const backgroundIconPath = 'assets/icons/logo-background.svg';
export const headerHeight = '72px';

const Container = styled.header`
  background: url(${backgroundIconPath}) no-repeat;
  background-color: ${({ theme }) => theme.color.backgroundBlue};
  height: ${headerHeight};

  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const LogoContainer = styled.div`
  padding-left: 20px;
`;

export function Header() {
  return (
    <Container>
      <LogoContainer>
        <SvgIcon size={40} src="assets/icons/logo.svg" />
      </LogoContainer>
    </Container>
  );
}
