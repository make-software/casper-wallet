import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';

import { Button, Typography } from '@libs/ui';
import {
  ContentContainer,
  HeaderTextContainer,
  TextContainer,
  ButtonsContainer
} from '@layout/containers';

import { RouterPath, useTypedNavigate } from '@popup/router';

import { removeAccount } from '@popup/redux/vault/actions';

export function RemoveAccountPageContent() {
  const navigate = useTypedNavigate();
  const dispatch = useDispatch();
  const { accountName } = useParams();

  const handleRemoveAccount = useCallback(() => {
    if (!accountName) {
      navigate(RouterPath.Home);
      return;
    }

    dispatch(removeAccount({ name: accountName }));
    navigate(RouterPath.Home);
  }, [dispatch, navigate, accountName]);

  if (!accountName) {
    navigate(RouterPath.Home);
    return null;
  }

  return (
    <ContentContainer>
      <HeaderTextContainer>
        <Typography type="header" weight="bold">
          Remove account?
        </Typography>
      </HeaderTextContainer>
      <TextContainer>
        <Typography type="body" weight="regular" color="contentSecondary">
          Are you sure you want to remove this account. This action can’t be
          undone.
        </Typography>
      </TextContainer>
      <ButtonsContainer>
        <Button onClick={handleRemoveAccount}>Remove</Button>
        <Button onClick={() => navigate(RouterPath.Home)} color="secondaryBlue">
          Cancel
        </Button>
      </ButtonsContainer>
    </ContentContainer>
  );
}
