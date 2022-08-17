import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';

import { Button, Typography } from '@libs/ui';

import {
  ContentContainer,
  HeaderTextContainer,
  TextContainer,
  FooterButtonsContainer
} from '@layout/containers';

import { RouterPath, useTypedNavigate } from '@popup/router';

import { removeAccount } from '@popup/redux/vault/actions';

export function RemoveAccountPageContent() {
  const navigate = useTypedNavigate();
  const dispatch = useDispatch();
  const { accountName } = useParams();
  const { t } = useTranslation();

  const handleRemoveAccount = useCallback(() => {
    if (!accountName) {
      navigate(RouterPath.Home);
      return;
    }

    dispatch(removeAccount({ accountName }));
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
          <Trans t={t}>Remove account?</Trans>
        </Typography>
      </HeaderTextContainer>
      <TextContainer>
        <Typography type="body" weight="regular" color="contentSecondary">
          <Trans t={t}>
            Are you sure you want to remove this account? This action can’t be
            undone.
          </Trans>
        </Typography>
      </TextContainer>
      <FooterButtonsContainer>
        <Button onClick={handleRemoveAccount}>
          <Trans t={t}>Remove</Trans>
        </Button>
        <Button onClick={() => navigate(-1)} color="secondaryBlue">
          <Trans t={t}>Cancel</Trans>
        </Button>
      </FooterButtonsContainer>
    </ContentContainer>
  );
}
