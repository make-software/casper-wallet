import React from 'react';
import styled from 'styled-components';

import { useNavigationMenu, useTypedLocation } from '@popup/router';

import { SvgIcon } from '@libs/ui';
import { vaultLocked } from '@src/background/redux/vault/actions';
import { dispatchToMainStore } from '../../../background/redux/utils';

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
    dispatchToMainStore(vaultLocked());
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
