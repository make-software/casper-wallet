import React from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { LocationState } from '@src/app';
import { SvgIcon } from '@src/libs/ui';
import { lockVault } from '@src/redux/vault/actions';

const Container = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 30px;
`;

interface IconButtonsProps {
  withLock?: boolean;
  withMenu?: boolean;
}

export function IconButtons({ withLock, withMenu }: IconButtonsProps) {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  function lockVaultHandle() {
    dispatch(lockVault());
  }

  function toggleMenuHandle() {
    const state = location.state as LocationState;

    navigate(location.pathname, {
      replace: true,
      state: { showNavigationMenu: !state?.showNavigationMenu }
    });
  }

  return (
    <Container>
      {withLock && (
        <SvgIcon
          onClick={lockVaultHandle}
          src="assets/icons/unlock.svg"
          size={24}
        />
      )}
      {withMenu && (
        <SvgIcon
          onClick={toggleMenuHandle}
          color="contentOnFill"
          src={
            (location.state as LocationState)?.showNavigationMenu
              ? 'assets/icons/burger-close.svg'
              : 'assets/icons/burger-menu.svg'
          }
          size={24}
        />
      )}
    </Container>
  );
}
