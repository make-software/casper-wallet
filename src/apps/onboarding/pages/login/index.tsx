import React, { Dispatch, SetStateAction } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { LayoutTab, TabFooterContainer } from '@libs/layout';
import { Button } from '@src/libs/ui';
import { useLoginForm } from '@libs/ui/forms/login';

import { RouterPath, useTypedNavigate } from '@src/apps/onboarding/router';
import { LoginPageContent } from '@src/apps/onboarding/pages/login/content';
import { setSessionLoginStatus } from '@src/apps/onboarding/utils/session-login-status';

interface LoginPageProps {
  setIsLoggedIn: Dispatch<SetStateAction<boolean>>;
}

export function LoginPage({ setIsLoggedIn }: LoginPageProps) {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { isDirty, errors }
  } = useLoginForm();

  function onSubmit() {
    setSessionLoginStatus(true);
    setIsLoggedIn(true);
    navigate(RouterPath.CreateSecretPhrase);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <LayoutTab
        layoutContext="withIllustration"
        renderContent={() => (
          <LoginPageContent
            register={register}
            errorMessage={errors.password?.message}
          />
        )}
        renderFooter={() => (
          <TabFooterContainer>
            <Button disabled={!isDirty} color="primaryRed">
              <Trans t={t}>Login</Trans>
            </Button>
          </TabFooterContainer>
        )}
      />
    </form>
  );
}
