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

interface IconButtonsProps {
  withLockButton?: boolean;
  withMenu?: boolean;
}

export function IconButtons({ withLockButton, withMenu }: IconButtonsProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  function lockVaultHandle() {
    dispatch(lockVault());
  }

  return (
    <Container>
      {withLockButton && (
        <SvgIcon
          onClick={lockVaultHandle}
          src="assets/icons/unlock.svg"
          size={24}
        />
      )}
      {withMenu && (
        <SvgIcon
          onClick={() => navigate(Routes.Timeout)}
          src="assets/icons/burger-menu.svg"
          size={24}
        />
      )}
    </Container>
  );
}
