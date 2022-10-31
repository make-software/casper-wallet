import React, { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from 'typesafe-actions';

import styled from 'styled-components';

import { ContentContainer, TextContainer } from '@src/libs/layout/containers';
import { SvgIcon, PageTile, Typography } from '@libs/ui';
import {
  selectVaultAccountWithName,
  selectVaultImportedAccounts
} from '@src/background/redux/vault/selectors';

import { RouterPath, useTypedNavigate } from '@popup/router';

export function AccountSettingsPageContent() {
  const navigate = useTypedNavigate();
  const { accountName } = useParams();
  const account = useSelector((state: RootState) =>
    selectVaultAccountWithName(state, accountName || '')
  );

  if (!account) {
    navigate(RouterPath.Home);
    return null;
  }

  return (
    <ContentContainer>
      <PageTile>
        <TextContainer gap="big">
          <Typography type="header">{account.name}</Typography>
        </TextContainer>
      </PageTile>
    </ContentContainer>
  );
}

interface AccountIconButtonProps {
  type: 'rename' | 'remove';
}

function AccountIconButton({ type }: AccountIconButtonProps) {
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
    />
  );
}

const AccountSettingsActionsGroupContainer = styled.div`
  display: flex;
  gap: 28px;
`;

export function AccountSettingsActionsGroup() {
  const { accountName } = useParams();
  const importedAccountNames = useSelector(selectVaultImportedAccounts).map(
    a => a.name
  );

  if (!accountName) {
    return null;
  }

  const isImportedAccount = importedAccountNames.includes(accountName);

  return (
    <AccountSettingsActionsGroupContainer>
      <AccountIconButton type="rename" />
      {isImportedAccount && <AccountIconButton type="remove" />}
    </AccountSettingsActionsGroupContainer>
  );
}
