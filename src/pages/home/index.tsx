import React from 'react';
import { Navigate } from 'react-router-dom';
import { Routes } from '@src/app/routes';
import { useSelector } from 'react-redux';
import { Typography } from '@src/libs/ui';
import {
  selectIsAccountCreated,
  selectIsVaultCreated,
  selectIsVaultLocked
} from '@src/redux/vault/selectors';
import {
  ContentContainer,
  HeaderTextContainer,
  TextContainer
} from '@src/layout/containers';

export function HomePageContent() {
  const isAccountExists = useSelector(selectIsAccountCreated);
  const isVaultExists = useSelector(selectIsVaultCreated);
  const isVaultLocked = useSelector(selectIsVaultLocked);

  if (isVaultLocked) {
    return <Navigate to={Routes.UnlockVault} replace={true} />;
  }

  if (!isVaultExists) {
    return <Navigate to={Routes.CreateVault} replace={true} />;
  }

  if (!isAccountExists) {
    return <Navigate to={Routes.NoAccounts} replace={true} />;
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
