import React from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { SvgIcon } from '@src/libs/ui';
import { lockVault } from '@src/redux/vault/actions';
import { Routes } from '@src/app/routes';

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

  function openMenuHandle() {
    if (location.pathname === Routes.Menu) {
      navigate(-1);
    } else {
      navigate(Routes.Menu);
    }
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
          onClick={openMenuHandle}
          src={
            // TODO: Change path to `close` menu icon
            location.pathname === Routes.Menu
              ? 'assets/icons/burger-menu.svg'
              : 'assets/icons/burger-menu.svg'
          }
          size={24}
        />
      )}
    </Container>
  );
}
