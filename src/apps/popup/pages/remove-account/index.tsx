import React, { useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { RouterPath, useTypedNavigate } from '@popup/router';

import { dispatchToMainStore } from '@background/redux/utils';
import { accountRemoved } from '@background/redux/vault/actions';

import {
  ContentContainer,
  FooterButtonsAbsoluteContainer,
  IllustrationContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { Button, SvgIcon, Typography } from '@libs/ui';

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
        <SvgIcon
          src="assets/illustrations/remove-account.svg"
          width={200}
          height={120}
        />
      </IllustrationContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Remove account?</Trans>
        </Typography>
      </ParagraphContainer>
      <ParagraphContainer top={SpacingSize.Medium}>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Are you sure you want to remove this account? The action can’t be
            undone.
          </Trans>
        </Typography>
      </ParagraphContainer>
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
