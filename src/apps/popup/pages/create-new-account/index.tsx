import React from 'react';
import { useSelector } from 'react-redux';
import { useTranslation, Trans } from 'react-i18next';
import { FieldValues } from 'react-hook-form';
import styled from 'styled-components';

import {
  LayoutWindow,
  PopupHeader,
  HeaderSubmenuBarNavLink,
  FooterButtonsContainer
} from '@src/libs/layout';
import { Button } from '@src/libs/ui';
import { useCreateNewAccountForm } from '@src/libs/ui/forms/create-new-account';

import { RouterPath, useTypedNavigate } from '@src/apps/popup/router';

import { selectVaultAccountsNames } from '@src/background/redux/vault/selectors';
import { dispatchToMainStore } from '@src/background/redux/utils';
import { accountCreated } from '@src/background/redux/vault/actions';

import { CreateNewAccountPageContent } from './content';

const CreateNewAccountForm = styled.form`
  height: 100%;
`;

export function CreateNewAccountPage() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();
  const existingAccountNames = useSelector(selectVaultAccountsNames);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty }
  } = useCreateNewAccountForm(existingAccountNames);
  const onSubmit = ({ name }: FieldValues) => {
    dispatchToMainStore(accountCreated(name.trim()));
    navigate(RouterPath.Home);
  };

  return (
    <CreateNewAccountForm onSubmit={handleSubmit(onSubmit)}>
      <LayoutWindow
        renderHeader={() => (
          <PopupHeader
            withLock
            withMenu
            withConnectionStatus
            renderSubmenuBarItems={() => (
              <HeaderSubmenuBarNavLink linkType="back" />
            )}
          />
        )}
        renderContent={() => (
          <CreateNewAccountPageContent
            register={register}
            errorMessage={errors.name?.message}
          />
        )}
        renderFooter={() => (
          <FooterButtonsContainer>
            <Button disabled={!isDirty}>
              <Trans t={t}>Create account</Trans>
            </Button>
            <Button
              color="secondaryBlue"
              onClick={() => navigate(RouterPath.Home)}
            >
              <Trans t={t}>Cancel</Trans>
            </Button>
          </FooterButtonsContainer>
        )}
      />
    </CreateNewAccountForm>
  );
}
