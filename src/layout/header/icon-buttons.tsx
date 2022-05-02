import React, { Dispatch, SetStateAction } from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';

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
  isMenuShow: boolean;
  setIsMenuShow: Dispatch<SetStateAction<boolean>>;
}

export function IconButtons({
  withLock,
  withMenu,
  isMenuShow,
  setIsMenuShow
}: IconButtonsProps) {
  const dispatch = useDispatch();

  function lockVaultHandle() {
    dispatch(lockVault());
  }

  function toggleMenuHandle() {
    setIsMenuShow(!isMenuShow);
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
          src={
            // TODO: Change path to `close` menu icon
            isMenuShow
              ? 'assets/icons/burger-menu.svg'
              : 'assets/icons/burger-menu.svg'
          }
          size={24}
        />
      )}
    </Container>
  );
}
