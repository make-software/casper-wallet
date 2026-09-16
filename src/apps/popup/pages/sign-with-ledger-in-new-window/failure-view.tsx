import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

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

interface IFailureViewProps {
  /** Already resolved through `getTransactionErrorCopy` — never a raw core key or node payload. */
  header: string;
  content: string;
  onClose: () => void;
}

/**
 * Shown when a flow fails after the device has signed — an RPC rejection, a node timeout, a
 * balance problem found on submission. Device-side failures go to `LedgerConnectionView`.
 */
export const FailureView: React.FC<IFailureViewProps> = ({
  header,
  content,
  onClose
}) => {
  const { t } = useTranslation();

  return (
    <PopupLayout
      renderHeader={() => (
        <HeaderPopup withNetworkSwitcher withConnectionStatus />
      )}
      renderContent={() => (
        <ContentContainer>
          <ParagraphContainer top={SpacingSize.XL}>
            <SvgIcon
              src="assets/illustrations/error.svg"
              width={200}
              height={120}
            />
            <VerticalSpaceContainer top={SpacingSize.XL}>
              <Typography type="header">{header}</Typography>
            </VerticalSpaceContainer>
            <VerticalSpaceContainer top={SpacingSize.Medium}>
              <Typography type="body" color="contentSecondary">
                {content}
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
