import React, { useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { RouterPath, useTypedNavigate } from '@popup/router';

import { selectIsCasper2Network } from '@background/redux/settings/selectors';

import {
  ContentContainer,
  ParagraphContainer,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { HomePageTabsId, SvgIcon, Typography } from '@libs/ui/components';

interface TransferSuccessScreenProps {
  headerText: string;
  children?: React.ReactNode;
}

export const TransferSuccessScreen = ({
  headerText,
  children
}: TransferSuccessScreenProps) => {
  const { t } = useTranslation();
  const navigate = useTypedNavigate();
  const isCasper2Network = useSelector(selectIsCasper2Network);

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

  useEffect(() => {
    const container = document.querySelector('#ms-container');

    container?.scrollTo(0, 0);
  }, []);

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
              {`You can check its status in the ${
                isCasper2Network ? 'Transactions' : 'Deploys'
              } tab on your Wallet home page.`}
            </Trans>
          </Typography>
        </VerticalSpaceContainer>
        {children}
      </ParagraphContainer>
    </ContentContainer>
  );
};
