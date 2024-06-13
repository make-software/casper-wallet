import { Player } from '@lottiefiles/react-lottie-player';
import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import {
  selectKeyDerivationSaltHash,
  selectPasswordHash,
  selectPasswordSaltHash
} from '@background/redux/keys/selectors';
import { unlockVault } from '@background/redux/sagas/actions';
import { UnlockVault } from '@background/redux/sagas/types';
import { dispatchToMainStore } from '@background/redux/utils';
import { selectVaultCipher } from '@background/redux/vault-cipher/selectors';
import { VaultState } from '@background/redux/vault/types';

import { useLockWalletWhenNoMoreRetries } from '@hooks/use-lock-wallet-when-no-more-retries';

import unlockAnimation from '@libs/animations/unlock_animation.json';
import {
  AlignedFlexRow,
  FooterButtonsContainer,
  HeaderPopup,
  LayoutWindow,
  LockedRouterPath,
  PopupLayout,
  SpacingSize
} from '@libs/layout';
import { Button, Typography } from '@libs/ui/components';
import {
  UnlockWalletFormValues,
  useUnlockWalletForm
} from '@libs/ui/forms/unlock-wallet';

import { UnlockVaultPageContent } from './content';

interface UnlockMessageEvent extends MessageEvent {
  data: UnlockVault;
}

interface UnlockVaultPageProps {
  popupLayout?: boolean;
}

export const UnlockVaultPage = ({ popupLayout }: UnlockVaultPageProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const { t } = useTranslation();
  const navigate = useNavigate();

  const passwordHash = useSelector(selectPasswordHash);
  const passwordSaltHash = useSelector(selectPasswordSaltHash);
  const keyDerivationSaltHash = useSelector(selectKeyDerivationSaltHash);
  const vaultCipher = useSelector(selectVaultCipher);

  if (passwordHash == null || passwordSaltHash == null) {
    throw Error("Password doesn't exist");
  }

  const {
    register,
    handleSubmit,
    resetField,
    formState: { errors }
  } = useUnlockWalletForm(passwordHash, passwordSaltHash);

  async function handleUnlockVault({ password }: UnlockWalletFormValues) {
    if (isLoading) return;

    setIsLoading(true);
    const unlockVaultWorker = new Worker(
      new URL('@background/workers/unlock-vault-worker.ts', import.meta.url)
    );

    if (keyDerivationSaltHash == null) {
      throw Error("Key derivation salt doesn't exist");
    }

    unlockVaultWorker.postMessage({
      password,
      keyDerivationSaltHash,
      vaultCipher
    });

    unlockVaultWorker.onmessage = (event: UnlockMessageEvent) => {
      const {
        vault,
        newKeyDerivationSaltHash,
        newVaultCipher,
        newEncryptionKeyHash
      } = event.data;

      // We should not store checksummed public keys because of possible issues on connect apps
      // that does not migrate to the new casper SDK behavior
      const hasCheckSummedPublicKeys = vault.accounts.some(acc =>
        /[A-Z]/.test(acc.publicKey)
      );

      // Mapping through vault accounts to update missing hidden property
      const updatedVaultWithHiddenProp = vault.accounts.map(acc => {
        // If the hidden property is undefined, set it to false
        if (acc.hidden === undefined) {
          return {
            ...acc,
            hidden: false
          };
        }

        return acc;
      });

      if (hasCheckSummedPublicKeys) {
        const updatedVault: VaultState = {
          ...vault,
          accounts: updatedVaultWithHiddenProp.map(acc => ({
            ...acc,
            publicKey: acc.publicKey.toLowerCase()
          }))
        };

        dispatchToMainStore(
          unlockVault({
            vault: updatedVault,
            newKeyDerivationSaltHash,
            newVaultCipher,
            newEncryptionKeyHash
          })
        );
      } else {
        dispatchToMainStore(
          unlockVault({
            vault: { ...vault, accounts: updatedVaultWithHiddenProp },
            newKeyDerivationSaltHash,
            newVaultCipher,
            newEncryptionKeyHash
          })
        );
      }
    };

    unlockVaultWorker.onerror = error => {
      console.error(error);
      setIsLoading(false);
    };
  }

  useLockWalletWhenNoMoreRetries(resetField);

  const footer = (
    <FooterButtonsContainer>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? (
          <AlignedFlexRow gap={SpacingSize.Small}>
            <Player
              renderer={'svg'}
              autoplay
              loop
              src={unlockAnimation}
              style={{ width: '24px', height: '24px' }}
            />
            <Typography type="bodySemiBold">
              <Trans t={t}>Unlocking...</Trans>
            </Typography>
          </AlignedFlexRow>
        ) : (
          <Typography type="bodySemiBold">
            <Trans t={t}>Unlock wallet</Trans>
          </Typography>
        )}
      </Button>
      <Button
        disabled={isLoading}
        type="button"
        color="secondaryRed"
        onClick={() => navigate(LockedRouterPath.ResetVault)}
      >
        {t('Reset wallet')}
      </Button>
    </FooterButtonsContainer>
  );

  return popupLayout ? (
    <PopupLayout
      variant="form"
      onSubmit={handleSubmit(handleUnlockVault)}
      renderHeader={() => <HeaderPopup />}
      renderContent={() => (
        <UnlockVaultPageContent register={register} errors={errors} />
      )}
      renderFooter={() => footer}
    />
  ) : (
    <LayoutWindow
      variant="form"
      onSubmit={handleSubmit(handleUnlockVault)}
      renderHeader={() => <HeaderPopup />}
      renderContent={() => (
        <UnlockVaultPageContent register={register} errors={errors} />
      )}
      renderFooter={() => footer}
    />
  );
};
