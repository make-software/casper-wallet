import React, { ReactElement } from 'react';
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

  padding: 0 16px;
`;

const LogoContainer = styled.div``;

interface HeaderProps {
  IconButtons?: ReactElement<any, any>;
}

export function Header({ IconButtons }: HeaderProps) {
  return (
    <Container>
      <LogoContainer>
        <SvgIcon size={40} src="assets/icons/logo.svg" />
      </LogoContainer>
      {IconButtons && IconButtons}
    </Container>
  );
}
