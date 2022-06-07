import React, { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from 'typesafe-actions';

import { ContentContainer, HeaderTextContainer } from '@layout/containers';
import { SvgIcon, Tile, Typography } from '@libs/ui';
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
      <Tile>
        <HeaderTextContainer>
          <Typography type="header" weight="bold">
            {account.name}
          </Typography>
        </HeaderTextContainer>
      </Tile>
    </ContentContainer>
  );
}

export function AccountSettingsActionsGroup() {
  const { accountName } = useParams();
  const navigate = useTypedNavigate();

  const handleNavigateToRemoveAccountPage = useCallback(() => {
    if (!accountName) {
      return;
    }

    navigate(RouterPath.RemoveAccount.replace(':accountName', accountName));
  }, [navigate, accountName]);

  if (!accountName) {
    return null;
  }

  return (
    <SvgIcon
      onClick={handleNavigateToRemoveAccountPage}
      color="contentRed"
      src="assets/icons/delete.svg"
      size={24}
    />
  );
}
