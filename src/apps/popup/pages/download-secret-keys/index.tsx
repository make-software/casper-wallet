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
import { getSubmitButtonStateFromValidation } from '@src/libs/ui/forms/get-submit-button-state-from-validation';
import { createAsymmetricKey } from '@src/libs/crypto/create-asymmetric-key';

import { RouterPath, useTypedNavigate } from '@src/apps/popup/router';

import {
  selectVaultImportedAccounts,
  selectVaultPasswordDigest
} from '@src/background/redux/vault/selectors';

import { DownloadSecretKeysPageContent } from './content';

import { downloadFile } from './utils';

export function DownloadSecretKeysPage() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const vaultPasswordDigest = useSelector(selectVaultPasswordDigest);
  const {
    register,
    handleSubmit,
    formState: { isDirty, errors }
  } = useDownloadSecretKeysForm(vaultPasswordDigest);

  const importedAccounts = useSelector(selectVaultImportedAccounts);

  if (importedAccounts.length === 0) {
    // Redirect to error page?
    throw new Error('There are no imported accounts!');
  }

  const onSubmit = () => {
    try {
      importedAccounts.forEach(account => {
        const asymmetricKey = createAsymmetricKey(
          account.publicKey,
          account.secretKey
        );
        const file = asymmetricKey.exportPrivateKeyInPem();
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

  const isSubmitButtonDisabled = getSubmitButtonStateFromValidation({
    isDirty
  });

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
          <Button disabled={isSubmitButtonDisabled}>
            <Trans t={t}>Download</Trans>
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
}
