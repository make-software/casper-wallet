import React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { FieldValues } from 'react-hook-form';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import {
  HeaderSubmenuBarNavLink,
  LayoutWindow,
  PopupHeader,
  FooterButtonsContainer
} from '@src/libs/layout';
import { Button } from '@src/libs/ui';
import { useDownloadSecretKeysForm } from '@src/libs/ui/forms/download-secret-keys';

import { RouterPath, useTypedNavigate } from '@src/apps/popup/router';

import { selectVaultPassword } from '@src/background/redux/vault/selectors';

import { DownloadSecretKeysPageContent } from './content';

const DownloadSecretKeysForm = styled.form`
  height: 100%;
`;

export function DownloadSecretKeysPage() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const expectedPassword = useSelector(selectVaultPassword);
  const {
    register,
    handleSubmit,
    formState: { isDirty, errors }
  } = useDownloadSecretKeysForm(expectedPassword);

  const onSubmit = (data: FieldValues) => {
    navigate(RouterPath.DownloadedSecretKeys);
  };

  return (
    <DownloadSecretKeysForm onSubmit={handleSubmit(onSubmit)}>
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
          <DownloadSecretKeysPageContent
            register={register}
            errorMessage={errors.password?.message}
          />
        )}
        renderFooter={() => (
          <FooterButtonsContainer>
            <Button disabled={!isDirty}>
              <Trans t={t}>Download</Trans>
            </Button>
          </FooterButtonsContainer>
        )}
      />
    </DownloadSecretKeysForm>
  );
}
