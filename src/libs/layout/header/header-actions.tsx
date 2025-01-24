import React from 'react';
import styled from 'styled-components';

import { useNavigationMenu, useTypedLocation } from '@popup/router';

import { HeaderNetworkSwitcher } from '@libs/layout';
import { HeaderBackgroundContainer } from '@libs/layout/header/components/header-background-container';
import { SvgIcon } from '@libs/ui/components';

const Container = styled.div`
  display: flex;
  justify-content: space-between;
`;

interface MainMenuBarProps {
  withNetworkSwitcher?: boolean;
  withMenu?: boolean;
}

export function HeaderActions({
  withNetworkSwitcher,
  withMenu
}: MainMenuBarProps) {
  const location = useTypedLocation();
  const { toggleNavigationMenu } = useNavigationMenu();

  return (
    <Container>
      {withNetworkSwitcher && <HeaderNetworkSwitcher />}
      {withMenu && (
        <HeaderBackgroundContainer
          isOpen={!!location.state?.showNavigationMenu}
        >
          <SvgIcon
            onClick={toggleNavigationMenu}
            color="contentOnFill"
            dataTestId={
              location.state?.showNavigationMenu
                ? 'menu-close-icon'
                : 'menu-open-icon'
            }
            src={
              location.state?.showNavigationMenu
                ? 'assets/icons/burger-close.svg'
                : 'assets/icons/burger-menu.svg'
            }
          />
        </HeaderBackgroundContainer>
      )}
    </Container>
  );
}
