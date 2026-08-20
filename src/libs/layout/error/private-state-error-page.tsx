import React from 'react';
import { useTranslation } from 'react-i18next';

import {
  FooterButtonsContainer,
  HeaderPopup,
  LayoutTab,
  LayoutWindow,
  PopupLayout
} from '@libs/layout';
import { Button } from '@libs/ui/components';

import { ErrorPageContent } from './content';

interface PrivateStateErrorPageProps {
  layout: 'popup' | 'window' | 'tab';
  onRetry: () => void;
}

/**
 * Shown when a vault-secrets fetch fails after timeout + retries, on the
 * backup-secret-phrase, create-account and wallet-qr-code pages.
 */
export function PrivateStateErrorPage({
  layout,
  onRetry
}: PrivateStateErrorPageProps) {
  const { t } = useTranslation();

  const content = (
    <ErrorPageContent
      errorHeaderText={t('Something went wrong')}
      errorContentText={t(
        'Couldn’t load your wallet data. This is usually temporary — please try again.'
      )}
      pageType={layout === 'tab' ? 'onboarding' : 'general'}
    />
  );

  const footer = (
    <FooterButtonsContainer>
      <Button color="primaryBlue" onClick={onRetry}>
        {t('Try again')}
      </Button>
    </FooterButtonsContainer>
  );

  if (layout === 'tab') {
    return (
      <LayoutTab
        layoutContext="withIllustration"
        renderContent={() => content}
        renderFooter={() => footer}
      />
    );
  }

  if (layout === 'window') {
    return (
      <LayoutWindow
        renderHeader={() => <HeaderPopup />}
        renderContent={() => content}
        renderFooter={() => footer}
      />
    );
  }

  return (
    <PopupLayout
      renderHeader={() => <HeaderPopup />}
      renderContent={() => content}
      renderFooter={() => footer}
    />
  );
}
