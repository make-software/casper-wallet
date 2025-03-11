import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { selectIsCasper2Network } from '@background/redux/settings/selectors';

import {
  ContentContainer,
  FooterButtonsContainer,
  HeaderPopup,
  ParagraphContainer,
  PopupLayout,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { Button, SvgIcon, Typography } from '@libs/ui/components';

interface ISuccessViewProps {
  onClose: () => void;
}

export const SuccessView: React.FC<ISuccessViewProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const isCasper2Network = useSelector(selectIsCasper2Network);

  return (
    <PopupLayout
      renderHeader={() => (
        <HeaderPopup withNetworkSwitcher withConnectionStatus />
      )}
      renderContent={() => (
        <ContentContainer>
          <ParagraphContainer top={SpacingSize.XL}>
            <SvgIcon
              src="assets/illustrations/success.svg"
              width={200}
              height={120}
            />
            <VerticalSpaceContainer top={SpacingSize.XL}>
              <Typography type="header">
                <Trans t={t}>{`${
                  isCasper2Network ? 'Transaction' : 'Deploy'
                } successfully sent`}</Trans>
              </Typography>
            </VerticalSpaceContainer>
            <VerticalSpaceContainer top={SpacingSize.Medium}>
              <Typography type="body" color="contentSecondary">
                <Trans t={t}>
                  You can close this window and continue to use extension
                </Trans>
              </Typography>
            </VerticalSpaceContainer>
          </ParagraphContainer>
        </ContentContainer>
      )}
      renderFooter={() => (
        <FooterButtonsContainer>
          <Button onClick={onClose}>
            <Trans t={t}>Close</Trans>
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
};
