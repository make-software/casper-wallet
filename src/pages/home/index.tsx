import React from 'react';
import styled from 'styled-components';

import { Typography } from '@src/libs/ui';
import { Navigate } from 'react-router-dom';
import { Routes } from '@src/app/routes';
import { useSelector } from 'react-redux';
import {
  selectIsAccountCreated,
  selectIsVaultCreated
} from '@src/redux/vault/selectors';

const Container = styled.div`
  height: 454px;
`;

const HeaderContainer = styled.div`
  margin-top: 60px;
`;

const TextContainer = styled.div`
  margin-top: 16px;
`;

export function HomePageContent() {
  const isAccountExists = useSelector(selectIsAccountCreated);
  const isVaultExists = useSelector(selectIsVaultCreated);

  if (!isVaultExists) {
    return <Navigate to={Routes.createVault} replace={true} />;
  }

  if (!isAccountExists) {
    return <Navigate to={Routes.createAccount} />;
  }

  return (
    <Container>
      <HeaderContainer>
        <Typography type="header" weight="semiBold">
          Home Page
        </Typography>
      </HeaderContainer>

      <TextContainer>
        <Typography type="body" weight="regular" variation="contentSecondary">
          Not implemented yet
        </Typography>
      </TextContainer>
    </Container>
  );
}
