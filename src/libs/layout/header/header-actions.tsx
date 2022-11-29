import React from 'react';
import styled from 'styled-components';

import { useNavigationMenu, useTypedLocation } from '@popup/router';

import { SvgIcon } from '@libs/ui';
import { dispatchToMainStore } from '@src/background/redux/utils';
import { lockVault } from '@src/background/redux/sagas/actions';

const Container = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 30px;
`;

interface MainmenuBarProps {
  withLock?: boolean;
  withMenu?: boolean;
}

export function HeaderActions({ withLock, withMenu }: MainmenuBarProps) {
  const location = useTypedLocation();
  const { toggleNavigationMenu } = useNavigationMenu();

  function handleLockVault() {
    dispatchToMainStore(lockVault());
  }

  return (
    <Container>
      {withLock && (
        <SvgIcon onClick={handleLockVault} src="assets/icons/unlock.svg" />
      )}
      {withMenu && (
        <SvgIcon
          onClick={toggleNavigationMenu}
          color="contentOnFill"
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
