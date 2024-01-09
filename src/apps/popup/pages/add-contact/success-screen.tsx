import React, { useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { RouterPath, useTypedNavigate } from '@popup/router';

import {
  ContentContainer,
  ParagraphContainer,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { SvgIcon, Typography } from '@libs/ui/components';

interface SuccessScreenProps {
  needToRedirectToHome: boolean;
}

export const SuccessScreen = ({ needToRedirectToHome }: SuccessScreenProps) => {
  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        needToRedirectToHome
          ? navigate(RouterPath.Home)
          : navigate(RouterPath.ContactList);
      }
    };
    window.addEventListener('keydown', keyDownHandler);

    return () => window.removeEventListener('keydown', keyDownHandler);
  }, [navigate, needToRedirectToHome]);

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <SvgIcon
          src="assets/illustrations/success.svg"
          width={200}
          height={120}
        />
        <VerticalSpaceContainer top={SpacingSize.XL}>
          <Typography type="header">
            <Trans t={t}>All done!</Trans>
          </Typography>
        </VerticalSpaceContainer>
        <VerticalSpaceContainer top={SpacingSize.Medium}>
          <Typography type="body" color="contentSecondary">
            <Trans t={t}>
              You will see this contact’s details and select it when you
              transfer or delegate tokens.
            </Trans>
          </Typography>
        </VerticalSpaceContainer>
      </ParagraphContainer>
    </ContentContainer>
  );
};
