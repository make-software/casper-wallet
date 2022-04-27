import React from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { Routes } from '@src/app/routes';
import { SvgIcon } from '@src/libs/ui';
import { lockVault as lockVaultAction } from '@src/redux/vault/actions';

const Container = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 30px;
`;

interface IconButtonsProps {
  lock?: boolean;
}

export function IconButtons({ lock }: IconButtonsProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  function lockVault() {
    dispatch(lockVaultAction());
    navigate(Routes.UnlockVault);
  }

  return (
    <Container>
      {lock && (
        <SvgIcon onClick={lockVault} src="assets/icons/unlock.svg" size={24} />
      )}
      <SvgIcon src="assets/icons/burger-menu.svg" size={24} />
    </Container>
  );
}
