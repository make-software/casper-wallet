import React from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';

import { SvgIcon } from '@src/libs/ui';
import { lockVault } from '@src/redux/vault/actions';
import { useNavigate } from 'react-router-dom';
import { Routes } from '@src/app/routes';

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
  const navigate = useNavigate();

  function lockVaultHandle() {
    dispatch(lockVault());
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
          // Temporary implementation. Navigation should migrate to menu items
          onClick={() => navigate(Routes.Timeout)}
          src="assets/icons/burger-menu.svg"
          size={24}
        />
      )}
    </Container>
  );
}
