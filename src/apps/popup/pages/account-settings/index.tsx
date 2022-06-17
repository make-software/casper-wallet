import React, { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from 'typesafe-actions';

import styled from 'styled-components';

import { ContentContainer, HeaderTextContainer } from '@layout/containers';
import { SvgIcon, PageTile, Typography } from '@libs/ui';
import { selectVaultAccountByName } from '@popup/redux/vault/selectors';

import { RouterPath, useTypedNavigate } from '@popup/router';

export function AccountSettingsPageContent() {
  const navigate = useTypedNavigate();
  const { accountName } = useParams();
  const account = useSelector((state: RootState) =>
    selectVaultAccountByName(state, accountName || '')
  );

  if (!account) {
    navigate(RouterPath.Home);
    return null;
  }

  return (
    <ContentContainer>
      <PageTile>
        <HeaderTextContainer>
          <Typography type="header" weight="bold">
            {account.name}
          </Typography>
        </HeaderTextContainer>
      </PageTile>
    </ContentContainer>
  );
}

interface AccountIconButtonProps {
  type: 'rename' | 'remove';
}

export function AccountIconButton({ type }: AccountIconButtonProps) {
  const { accountName } = useParams();
  const navigate = useTypedNavigate();

  const handleNavigateToNextPage = useCallback(() => {
    if (!accountName) {
      return;
    }

    const path =
      type === 'remove'
        ? RouterPath.RemoveAccount.replace(':accountName', accountName)
        : RouterPath.RenameAccount.replace(':accountName', accountName);

    navigate(path);
  }, [navigate, accountName, type]);

  if (!accountName) {
    return null;
  }

  return (
    <SvgIcon
      onClick={handleNavigateToNextPage}
      color={type === 'remove' ? 'contentRed' : 'contentBlue'}
      src={
        type === 'remove' ? 'assets/icons/delete.svg' : 'assets/icons/edit.svg'
      }
      size={24}
    />
  );
}

const AccountSettingsActionsGroupContainer = styled.div`
  display: flex;
  gap: 28px;
`;

export function AccountSettingsActionsGroup() {
  return (
    <AccountSettingsActionsGroupContainer>
      <AccountIconButton type="rename" />
      <AccountIconButton type="remove" />
    </AccountSettingsActionsGroupContainer>
  );
}
