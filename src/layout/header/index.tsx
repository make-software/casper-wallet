import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

import { SvgIcon } from '@src/libs/ui';
import { RouterPaths } from '@src/app/router/paths';

import { MainmenuBar } from './mainmenu-bar';
import { SubmenuBar } from './submenu-bar';

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

const LogoContainer = styled.div`
  cursor: pointer;
`;

interface HeaderProps {
  withLock?: boolean;
  withMenu?: boolean;
  submenuActionType?: 'back' | 'close' | 'cancel';
}

export function Header({ withLock, withMenu, submenuActionType }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <>
      <Container>
        <LogoContainer>
          <SvgIcon
            onClick={() => navigate(RouterPaths.Home)}
            size={40}
            src="assets/icons/logo.svg"
          />
        </LogoContainer>
        <MainmenuBar withMenu={withMenu} withLock={withLock} />
      </Container>
      {submenuActionType && <SubmenuBar actionType={submenuActionType} />}
    </>
  );
}
