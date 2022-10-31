import React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useSelector } from 'react-redux';

import {
  HeaderSubmenuBarNavLink,
  LayoutWindow,
  PopupHeader,
  FooterButtonsContainer
} from '@src/libs/layout';
import { Button } from '@src/libs/ui';
import { useDownloadSecretKeysForm } from '@src/libs/ui/forms/download-secret-keys';

import { RouterPath, useTypedNavigate } from '@src/apps/popup/router';

import {
  selectVaultImportedAccounts,
  selectVaultPassword
} from '@src/background/redux/vault/selectors';

import { DownloadSecretKeysPageContent } from './content';

import { downloadFile, makeSecretKeyFileContent } from './utils';

export function DownloadSecretKeysPage() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const expectedPassword = useSelector(selectVaultPassword);
  const {
    register,
    handleSubmit,
    formState: { isDirty, errors }
  } = useDownloadSecretKeysForm(expectedPassword);

  const importedAccounts = useSelector(selectVaultImportedAccounts);

  if (importedAccounts.length === 0) {
    // Redirect to error page?
    throw new Error("Imported accounts wasn't found");
  }

  const onSubmit = () => {
    try {
      importedAccounts.forEach(account => {
        const file = makeSecretKeyFileContent(
          account.publicKey,
          account.secretKey
        );
        downloadFile(
          new Blob([file], { type: 'text/plain;charset=utf-8' }),
          `${account.name}_secret_key.pem`
        );
      });
    } catch (e) {
      // Redirect to error page?
      console.error(e);
    }

    navigate(RouterPath.DownloadedSecretKeys);
  };

  return (
    <LayoutWindow
      variant="form"
      onSubmit={handleSubmit(onSubmit)}
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
  );
}
