import React from 'react';
import styled from 'styled-components';

import { useNavigationMenu, useTypedLocation } from '@popup/router';

import { HeaderNetworkSwitcher } from '@libs/layout';
import { SvgIcon } from '@libs/ui';

const Container = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 18px;
`;

interface MainmenuBarProps {
  withNetworkSwitcher?: boolean;
  withMenu?: boolean;
}

export function HeaderActions({
  withNetworkSwitcher,
  withMenu
}: MainmenuBarProps) {
  const location = useTypedLocation();
  const { toggleNavigationMenu } = useNavigationMenu();

  return (
    <Container>
      {withNetworkSwitcher && <HeaderNetworkSwitcher />}
      {withMenu && (
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
      )}
    </Container>
  );
}
