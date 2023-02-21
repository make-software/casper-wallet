import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  HeaderSubmenuBarNavLink,
  LayoutTab,
  TabFooterContainer,
  TabHeaderContainer
} from '@libs/layout';
import { Button, Checkbox } from '@libs/ui';
import {
  CreatePasswordFormValues,
  useCreatePasswordForm
} from '@libs/ui/forms/create-password';

import { Stepper } from '@src/apps/onboarding/components/stepper';
import { RouterPath } from '@src/apps/onboarding/router';
import { useTypedNavigate } from '@src/apps/onboarding/router/use-typed-navigate';

import { dispatchToMainStore } from '@background/redux/utils';

import { CreateVaultPasswordPageContent } from './content';
import { useSelector } from 'react-redux';
import { selectPasswordHash } from '@src/background/redux/keys/selectors';
import { initKeys } from '@src/background/redux/sagas/actions';
import styled from 'styled-components';

interface CreateVaultPasswordPageProps {
  saveIsLoggedIn: (isLoggedIn: boolean) => void;
}

const TermsLink = styled.a`
  text-decoration: none;
`;

export function CreateVaultPasswordPage({
  saveIsLoggedIn
}: CreateVaultPasswordPageProps) {
  const [isChecked, setIsChecked] = useState(false);
  const navigate = useTypedNavigate();
  const { t } = useTranslation();
  const passwordHash = useSelector(selectPasswordHash);

  const { register, handleSubmit, formState } = useCreatePasswordForm();
  const { isDirty, isSubmitSuccessful } = formState;
  useEffect(() => {
    if (passwordHash) {
      navigate(RouterPath.CreateSecretPhrase);
    }
  }, [navigate, passwordHash]);

  async function onSubmit(data: CreatePasswordFormValues) {
    dispatchToMainStore(initKeys({ password: data.password }));
    saveIsLoggedIn(true);
  }

  const terms = (
    <Trans>
      I have read and agree to the{' '}
      <TermsLink href="https://www.casperwallet.io/tos">
        Casper Wallet Terms of Service
      </TermsLink>{' '}
      and{' '}
      <TermsLink href="https://www.casperwallet.io/privacy">
        Privacy Policy
      </TermsLink>
      .
    </Trans>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <LayoutTab
        layoutContext="withStepper"
        renderHeader={() => (
          <TabHeaderContainer>
            <HeaderSubmenuBarNavLink linkType="back" />
            <Stepper length={6} activeIndex={0} />
          </TabHeaderContainer>
        )}
        renderContent={() => (
          <CreateVaultPasswordPageContent
            formState={formState}
            register={register}
          />
        )}
        renderFooter={() => (
          <TabFooterContainer>
            <Checkbox
              checked={isChecked}
              onChange={() => setIsChecked(currentValue => !currentValue)}
              label={terms}
            />
            <Button disabled={!isChecked || !isDirty || isSubmitSuccessful}>
              <Trans t={t}>Create password</Trans>
            </Button>
          </TabFooterContainer>
        )}
      />
    </form>
  );
}
