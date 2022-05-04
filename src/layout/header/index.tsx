import React from 'react';
import styled from 'styled-components';

import { SvgIcon } from '@src/libs/ui';

import { IconButtonsBar } from './icon-buttons-bar';
import { ManuIcon } from './menu-icon';

const backgroundIconPath = 'assets/icons/logo-background.svg';

const Container = styled.header`
  background: url(${backgroundIconPath}) no-repeat;
  background-color: ${({ theme }) => theme.color.backgroundBlue};
  height: 72px;

  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 0 16px;
`;

const LogoContainer = styled.div``;

interface HeaderProps {
  withLock?: boolean;
  withMenu?: boolean;
  menuIconType?: 'back' | 'close' | 'cancel';
}

export function Header({ withLock, withMenu, menuIconType }: HeaderProps) {
  return (
    <>
      <Container>
        <LogoContainer>
          <SvgIcon size={40} src="assets/icons/logo.svg" />
        </LogoContainer>
        <IconButtonsBar withMenu={withMenu} withLock={withLock} />
      </Container>
      {menuIconType && <ManuIcon type={menuIconType} />}
    </>
  );
}
