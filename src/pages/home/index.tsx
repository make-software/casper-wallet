import React from 'react';
import { Navigate } from 'react-router-dom';
import { Routes } from '@src/app/routes';
import { useSelector } from 'react-redux';
import { Typography } from '@src/libs/ui';
import {
  selectIsAccountCreated,
  selectIsVaultCreated
} from '@src/redux/vault/selectors';
import {
  ContentContainer,
  HeaderTextContainer,
  TextContainer
} from '@src/layout/containers';

export function HomePageContent() {
  const isAccountExists = useSelector(selectIsAccountCreated);
  const isVaultExists = useSelector(selectIsVaultCreated);

  if (!isVaultExists) {
    return <Navigate to={Routes.CreateVault} replace={true} />;
  }

  if (!isAccountExists) {
    return <Navigate to={Routes.NoAccounts} />;
  }

  return (
    <ContentContainer>
      <HeaderTextContainer>
        <Typography type="header" weight="semiBold">
          Home Page
        </Typography>
      </HeaderTextContainer>

      <TextContainer>
        <Typography type="body" weight="regular" variation="contentSecondary">
          Not implemented yet
        </Typography>
      </TextContainer>
    </ContentContainer>
  );
}
