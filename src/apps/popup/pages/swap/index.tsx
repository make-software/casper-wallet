import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { useTypedLocation } from '@popup/router';

import {
  ContentContainer,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  ParagraphContainer,
  PopupLayout,
  SpacingSize
} from '@libs/layout';
import { Typography } from '@libs/ui/components';

export const SwapPage = () => {
  const { t } = useTranslation();
  const { state } = useTypedLocation();

  return (
    <PopupLayout
      renderHeader={() => (
        <HeaderPopup
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={() => (
            <HeaderSubmenuBarNavLink linkType="back" />
          )}
        />
      )}
      renderContent={() => (
        <ContentContainer>
          <ParagraphContainer top={SpacingSize.XL}>
            <Typography type="header">
              <Trans t={t}>Swap</Trans>
            </Typography>
          </ParagraphContainer>
          <ParagraphContainer top={SpacingSize.Medium}>
            <Typography type="body" color="contentSecondary">
              {state?.swapFromTokenId ?? '—'}
            </Typography>
          </ParagraphContainer>
        </ContentContainer>
      )}
    />
  );
};
