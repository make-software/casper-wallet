import React, { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';

import {
  ContentContainer,
  IllustrationContainer,
  TextContainer,
  FooterButtonsAbsoluteContainer
} from '@src/libs/layout/containers';
import { Button, Typography, SvgIcon } from '@src/libs/ui';

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
      <IllustrationContainer>
        <SvgIcon src="assets/illustrations/remove-account.svg" size={120} />
      </IllustrationContainer>
      <TextContainer gap="big">
        <Typography type="header">
          <Trans t={t}>Remove account?</Trans>
        </Typography>
      </TextContainer>
      <TextContainer gap="medium">
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Are you sure you want to remove this account? This action can’t be
            undone.
          </Trans>
        </Typography>
      </TextContainer>
      <FooterButtonsAbsoluteContainer>
        <Button color="primaryRed" onClick={handleRemoveAccount}>
          <Trans t={t}>Remove</Trans>
        </Button>
        <Button onClick={() => navigate(-1)} color="secondaryBlue">
          <Trans t={t}>Cancel</Trans>
        </Button>
      </FooterButtonsAbsoluteContainer>
    </ContentContainer>
  );
}
