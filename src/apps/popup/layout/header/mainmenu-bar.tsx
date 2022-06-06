import React from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { useNavigationMenu, useTypedLocation } from '@popup/router';

import { SvgIcon } from '@libs/ui';
import { lockVault } from '@popup/redux/vault/actions';

const Container = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 30px;
`;

interface MainmenuBarProps {
  withLock?: boolean;
  withMenu?: boolean;
}

export function MainmenuBar({ withLock, withMenu }: MainmenuBarProps) {
  const dispatch = useDispatch();
  const location = useTypedLocation();
  const { toggleNavigationMenu } = useNavigationMenu();

  function handleLockVault() {
    dispatch(lockVault());
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
            location.state.showNavigationMenu
              ? 'assets/icons/burger-close.svg'
              : 'assets/icons/burger-menu.svg'
          }
          size={24}
        />
      )}
    </Container>
  );
}
