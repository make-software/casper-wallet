import React, { useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { FieldValues } from 'react-hook-form';

import {
  LayoutTab,
  TabFooterContainer,
  HeaderSubmenuBarNavLink
} from '@libs/layout';
import { Button } from '@libs/ui';
import { useRecoverWalletFromSecretPhrase } from '@libs/ui/forms/recover-wallet-from-secret-phrase';

import { mockedMnemonicPhrase } from '@src/apps/onboarding/mockedData';
import { useTypedNavigate } from '@src/apps/onboarding/router/use-typed-navigate';
import { RouterPath } from '@src/apps/onboarding/router';
import { closeActiveTab } from '@src/apps/onboarding/utils/closeActiveTab';

import { RecoverWalletFromSecretPhrasePageContent } from './content';

export function RecoverWalletFromSecretPhrasePage() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty }
  } = useRecoverWalletFromSecretPhrase(mockedMnemonicPhrase.join(' '));

  useEffect(() => {
    if (errors.phrase?.message === "Phrase didn't match") {
      navigate(RouterPath.Error, {
        state: {
          errorHeaderText: t(
            'We can’t connect your wallet with this secret phrase'
          ),
          errorContentText: t(
            'It could be you’ve made a mistake while entering it. Please try again.'
          ),
          primaryButtonLabel: t('Try again')
        }
      });
    }
  }, [navigate, t, errors]);

  function onSubmit(data: FieldValues) {
    closeActiveTab().catch(e => console.error(e));
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <LayoutTab
        layoutContext="withStepper"
        renderHeader={() => <HeaderSubmenuBarNavLink linkType="back" />}
        renderContent={() => (
          <RecoverWalletFromSecretPhrasePageContent register={register} />
        )}
        renderFooter={() => (
          <TabFooterContainer>
            <Button disabled={!isDirty}>
              <Trans t={t}>Connect to my wallet</Trans>
            </Button>
          </TabFooterContainer>
        )}
      />
    </form>
  );
}
