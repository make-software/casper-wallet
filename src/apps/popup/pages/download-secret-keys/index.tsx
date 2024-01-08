import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { RouterPath, useTypedNavigate } from '@popup/router';

import {
  selectPasswordHash,
  selectPasswordSaltHash
} from '@background/redux/keys/selectors';
import { loginRetryCountReseted } from '@background/redux/login-retry-count/actions';
import { dispatchToMainStore } from '@background/redux/utils';
import { selectVaultImportedAccounts } from '@background/redux/vault/selectors';

import { createAsymmetricKey } from '@libs/crypto/create-asymmetric-key';
import {
  FooterButtonsContainer,
  HeaderSubmenuBarNavLink,
  PopupHeader,
  PopupLayout,
  UnlockProtectedPageContent
} from '@libs/layout';
import { Button } from '@libs/ui';
import { calculateSubmitButtonDisabled } from '@libs/ui/forms/get-submit-button-state-from-validation';
import { useUnlockWalletForm } from '@libs/ui/forms/unlock-wallet';

import { downloadFile } from './utils';

export function DownloadSecretKeysPage() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const passwordHash = useSelector(selectPasswordHash);
  const passwordSaltHash = useSelector(selectPasswordSaltHash);

  if (passwordHash == null || passwordSaltHash == null) {
    throw Error("Password doesn't exist");
  }

  const {
    register,
    handleSubmit,
    formState: { isDirty, errors }
  } = useUnlockWalletForm(passwordHash, passwordSaltHash);

  const importedAccounts = useSelector(selectVaultImportedAccounts);

  if (importedAccounts.length === 0) {
    // Redirect to error page?
    throw new Error('There are no imported accounts!');
  }

  const onSubmit = () => {
    dispatchToMainStore(loginRetryCountReseted());
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

  const isSubmitButtonDisabled = calculateSubmitButtonDisabled({
    isDirty
  });

  return (
    <PopupLayout
      variant="form"
      onSubmit={handleSubmit(onSubmit)}
      renderHeader={() => (
        <PopupHeader
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={() => (
            <HeaderSubmenuBarNavLink linkType="back" />
          )}
        />
      )}
      renderContent={() => (
        <UnlockProtectedPageContent
          register={register}
          errors={errors}
          title={t('Enter your password to download your secret key file')}
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
