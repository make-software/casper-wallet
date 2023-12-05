import React, { useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  ContentContainer,
  ParagraphContainer,
  SpacingSize,
  VerticalSpaceContainer
} from '@src/libs/layout';
import { HomePageTabsId, SvgIcon, Typography } from '@libs/ui';
import { RouterPath, useTypedNavigate } from '@popup/router';

interface TransferSuccessScreenProps {
  headerText: string;
}

export const TransferSuccessScreen = ({
  headerText
}: TransferSuccessScreenProps) => {
  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        navigate(RouterPath.Home, {
          state: {
            // set the active tab to deploys
            activeTabId: HomePageTabsId.Deploys
          }
        });
      }
    };

    window.addEventListener('keydown', keyDownHandler);

    return () => window.removeEventListener('keydown', keyDownHandler);
  }, [navigate]);

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
            <Trans t={t}>{headerText}</Trans>
          </Typography>
        </VerticalSpaceContainer>
        <VerticalSpaceContainer top={SpacingSize.Medium}>
          <Typography type="body" color="contentSecondary">
            <Trans t={t}>
              You can check its status in the Deploys tab on your Wallet home
              page.
            </Trans>
          </Typography>
        </VerticalSpaceContainer>
      </ParagraphContainer>
    </ContentContainer>
  );
};
