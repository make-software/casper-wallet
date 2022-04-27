import React from 'react';
import styled from 'styled-components';

import { SvgIcon } from '@src/libs/ui';

import { IconButtons } from './icon-buttons';
import { NavigationBar } from './navigation-bar';

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
  withLockButton?: boolean;
  withMenu?: boolean;
  subHeaderLink?: 'back' | 'close' | 'cancel';
}

export function Header({
  withLockButton,
  withMenu,
  subHeaderLink
}: HeaderProps) {
  return (
    <>
      <Container>
        <LogoContainer>
          <SvgIcon size={40} src="assets/icons/logo.svg" />
        </LogoContainer>
        <IconButtons withMenu={withMenu} withLockButton={withLockButton} />
      </Container>
      {subHeaderLink && <NavigationBar type={subHeaderLink} />}
    </>
  );
}
