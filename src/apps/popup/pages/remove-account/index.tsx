import React, { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';

import { Button, Typography } from '@libs/ui';

import {
  ContentContainer,
  HeaderTextContainer,
  TextContainer,
  FooterButtonsAbsoluteContainer
} from '@src/libs/layout/containers';

import { RouterPath, useTypedNavigate } from '@popup/router';

import { accountRemoved } from '@src/background/redux/vault/actions';
import { dispatchToMainStore } from '../../../../background/redux/utils';

export function RemoveAccountPageContent() {
  const navigate = useTypedNavigate();
  const { accountName } = useParams();
  const { t } = useTranslation();

  const handleRemoveAccount = useCallback(() => {
    if (!accountName) {
      navigate(RouterPath.Home);
      return;
    }

    dispatchToMainStore(accountRemoved({ accountName }));
    navigate(RouterPath.Home);
  }, [navigate, accountName]);

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
      <FooterButtonsAbsoluteContainer>
        <Button onClick={handleRemoveAccount}>
          <Trans t={t}>Remove</Trans>
        </Button>
        <Button onClick={() => navigate(-1)} color="secondaryBlue">
          <Trans t={t}>Cancel</Trans>
        </Button>
      </FooterButtonsAbsoluteContainer>
    </ContentContainer>
  );
}
