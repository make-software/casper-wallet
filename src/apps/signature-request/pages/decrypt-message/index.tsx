import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { shallowEqual, useSelector } from 'react-redux';

import { ErrorMessages } from '@src/constants';
import { getSigningAccount } from '@src/utils';

import { closeCurrentWindow } from '@background/close-current-window';
import {
  selectConnectedAccountNamesWithActiveOrigin,
  selectVaultAccounts
} from '@background/redux/vault/selectors';
import { sendSdkResponseToSpecificTab } from '@background/send-sdk-response-to-specific-tab';

import { sdkMethod } from '@content/sdk-method';

import { decryptEncryptedBase64PrivateKey } from '@libs/crypto';
import {
  FooterButtonsContainer,
  HeaderPopup,
  LayoutWindow
} from '@libs/layout';
import { HardwareWalletType } from '@libs/types/account';
import { Button } from '@libs/ui/components';

import { DecryptMessageContent } from './decrypt-message-content';

export function DecryptMessagePage() {
  const { t } = useTranslation();
  const searchParams = new URLSearchParams(document.location.search);
  const [decryptedMessage, setDecryptedMessage] = useState('');
  const [hasDecryptionError, setHasDecryptionError] = useState(false);

  const requestId = searchParams.get('requestId');
  const message = searchParams.get('message');
  const signingPublicKeyHex = searchParams.get('signingPublicKeyHex');

  if (!requestId || !message || !signingPublicKeyHex) {
    throw Error(
      `${ErrorMessages.signTransaction.MISSING_SEARCH_PARAM.description} ${requestId} ${message} ${signingPublicKeyHex}`
    );
  }

  const vaultAccounts = useSelector(selectVaultAccounts, shallowEqual);

  const connectedAccountNamesWithOrigin = useSelector(
    selectConnectedAccountNamesWithActiveOrigin
  );

  const connectedAccountNames = useMemo(
    () => connectedAccountNamesWithOrigin,
    [connectedAccountNamesWithOrigin]
  );

  const signingAccount = getSigningAccount(vaultAccounts, signingPublicKeyHex);

  if (!signingAccount) {
    const error = Error(
      ErrorMessages.signTransaction.SIGNING_ACCOUNT_MISSING.description
    );
    sendSdkResponseToSpecificTab(
      sdkMethod.signMessageError(error, { requestId })
    );
    throw error;
  }

  if (signingAccount.hardware === HardwareWalletType.Ledger) {
    const error = Error(
      ErrorMessages.decryptMessage.LEDGER_NOT_SUPPORTED.description
    );
    sendSdkResponseToSpecificTab(
      sdkMethod.signMessageError(error, { requestId })
    );
    throw error;
  }

  if (
    connectedAccountNames &&
    !connectedAccountNames.includes(signingAccount.name)
  ) {
    const error = Error(
      ErrorMessages.signTransaction.ACCOUNT_NOT_CONNECTED.description
    );
    sendSdkResponseToSpecificTab(
      sdkMethod.signMessageError(error, { requestId })
    );
    throw error;
  }

  const handleCancel = useCallback(() => {
    sendSdkResponseToSpecificTab(
      sdkMethod.decryptMessageResponse({ cancelled: true }, { requestId })
    );
    closeCurrentWindow();
  }, [requestId]);

  useEffect(() => {
    window.addEventListener('beforeunload', handleCancel);

    return () => window.removeEventListener('beforeunload', handleCancel);
  }, [handleCancel]);

  const handleDecrypt = useCallback(async () => {
    try {
      if (!message) {
        return;
      }

      const mdg = await decryptEncryptedBase64PrivateKey(
        message,
        signingAccount.publicKey,
        signingAccount.secretKey
      );

      setHasDecryptionError(false);
      setDecryptedMessage(mdg);
    } catch (e) {
      setHasDecryptionError(true);
      console.error(e);
    }
  }, [message, signingAccount.publicKey, signingAccount.secretKey]);

  const handleSendResponse = useCallback(async () => {
    if (!decryptedMessage) {
      return;
    }

    sendSdkResponseToSpecificTab(
      sdkMethod.decryptMessageResponse(
        { decryptedMessage, cancelled: false },
        { requestId }
      )
    );
    closeCurrentWindow();
  }, [decryptedMessage, requestId]);

  const renderFooter = useCallback(() => {
    return (
      <FooterButtonsContainer>
        <Button
          color="primaryRed"
          onClick={decryptedMessage ? handleSendResponse : handleDecrypt}
        >
          <Trans t={t}>
            {decryptedMessage ? 'Send response to app' : 'Decrypt'}
          </Trans>
        </Button>
        <Button color="secondaryBlue" onClick={handleCancel}>
          <Trans t={t}>Cancel</Trans>
        </Button>
      </FooterButtonsContainer>
    );
  }, [decryptedMessage, handleCancel, handleDecrypt, handleSendResponse, t]);

  return (
    <LayoutWindow
      renderHeader={() => <HeaderPopup />}
      renderContent={() => (
        <DecryptMessageContent
          message={message}
          hasDecryptionError={hasDecryptionError}
          decryptedMessage={decryptedMessage}
          publicKeyHex={signingPublicKeyHex}
        />
      )}
      renderFooter={renderFooter}
    />
  );
}
