import React from 'react';
import styled from 'styled-components';

import { SvgIcon } from '@src/libs/ui';
import { IconButtons } from '@src/layout/header/icon-buttons';

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
  withLock?: boolean;
  withMenu?: boolean;
}

export function Header({ withLock, withMenu }: HeaderProps) {
  return (
    <Container>
      <LogoContainer>
        <SvgIcon size={40} src="assets/icons/logo.svg" />
      </LogoContainer>
      <IconButtons withMenu={withMenu} withLock={withLock} />
    </Container>
  );
}
