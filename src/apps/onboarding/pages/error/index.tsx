import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import { LayoutTab, TabFooterContainer } from '@libs/layout';
import { Button } from '@libs/ui';

import { useTypedNavigate } from '@src/apps/onboarding/router/use-typed-navigate';
import { RouterPath } from '@src/apps/onboarding/router';

import { ErrorPageContent } from './content';

export function ErrorPage() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  return (
    <LayoutTab
      layoutContext="withIllustration"
      renderContent={() => <ErrorPageContent />}
      renderFooter={() => (
        <TabFooterContainer>
          <Button onClick={() => navigate(RouterPath.Welcome)}>
            <Trans t={t}>Start over again</Trans>
          </Button>
        </TabFooterContainer>
      )}
    />
  );
}
