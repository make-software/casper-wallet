import React from 'react';
import styled from 'styled-components';

import { useNavigationMenu, useTypedLocation } from '~src/apps/popup/router';

import { SvgIcon } from '~src/libs/ui';
import { vaultLocked } from '~src/libs/redux/vault/actions';
import { dispatchToMainStore } from '../../redux/utils';

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
        <SvgIcon
          onClick={handleLockVault}
          src="assets/icons/unlock.svg"
          size={24}
        />
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
          size={24}
        />
      )}
    </Container>
  );
}
