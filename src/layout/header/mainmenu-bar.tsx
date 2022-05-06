import React from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';

import { SvgIcon } from '@src/libs/ui';
import { lockVault } from '@src/redux/vault/actions';
import { useNavigationMenu } from '@src/app/router/use-navigation-menu';
import { useTypedLocation } from '@src/app/router';

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
