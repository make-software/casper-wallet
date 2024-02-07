import React, { useCallback, useEffect, useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { getSigningAccount } from '@src/utils';

import { closeCurrentWindow } from '@background/close-current-window';
import {
  selectConnectedAccountNamesWithActiveOrigin,
  selectVaultAccounts
} from '@background/redux/vault/selectors';
import { sendSdkResponseToSpecificTab } from '@background/send-sdk-response-to-specific-tab';

import { sdkMethod } from '@content/sdk-method';

import { signMessage } from '@libs/crypto/sign-message';
import { convertBytesToHex } from '@libs/crypto/utils';
import {
  FooterButtonsContainer,
  HeaderPopup,
  LayoutWindow
} from '@libs/layout';
import { Button } from '@libs/ui/components';

import { SignMessageContent } from './sign-message-content';

export function SignMessagePage() {
  const { t } = useTranslation();

  const searchParams = new URLSearchParams(document.location.search);
  const requestId = searchParams.get('requestId');
  const message = searchParams.get('message');
  const signingPublicKeyHex = searchParams.get('signingPublicKeyHex');

  if (!requestId || !message || !signingPublicKeyHex) {
    throw Error(
      `Missing search param: ${requestId} ${message} ${signingPublicKeyHex}`
    );
  }

  const renderDeps = [requestId, signingPublicKeyHex];

  const vaultAccounts = useSelector(selectVaultAccounts);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const accounts = useMemo(() => vaultAccounts, renderDeps);

  const connectedAccountNamesWithOrigin = useSelector(
    selectConnectedAccountNamesWithActiveOrigin
  );
  const connectedAccountNames = useMemo(
    () => connectedAccountNamesWithOrigin,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    renderDeps
  );

  const signingAccount = getSigningAccount(accounts, signingPublicKeyHex);

  // signing account should exist in wallet
  if (signingAccount == null) {
    const error = Error('No signing account');
    sendSdkResponseToSpecificTab(
      sdkMethod.signMessageError(error, { requestId })
    );
    throw error;
  }

  // signing account should be connected to site
  if (
    connectedAccountNames != null &&
    !connectedAccountNames.includes(signingAccount.name)
  ) {
    const error = Error(
      'Account with signingPublicKeyHex is not connected to site'
    );
    sendSdkResponseToSpecificTab(
      sdkMethod.signMessageError(error, { requestId })
    );
    throw error;
  }

  const handleSign = useCallback(() => {
    if (message == null) {
      return;
    }

    const signature = signMessage(
      message,
      signingAccount.publicKey,
      signingAccount.secretKey
    );
    sendSdkResponseToSpecificTab(
      sdkMethod.signMessageResponse(
        { signatureHex: convertBytesToHex(signature), cancelled: false },
        { requestId }
      )
    );
    closeCurrentWindow();
  }, [
    signingAccount?.publicKey,
    signingAccount?.secretKey,
    message,
    requestId
  ]);

  const handleCancel = useCallback(() => {
    sendSdkResponseToSpecificTab(
      sdkMethod.signResponse({ cancelled: true }, { requestId })
    );
    closeCurrentWindow();
  }, [requestId]);

  useEffect(() => {
    window.addEventListener('beforeunload', handleCancel);

    return () => window.removeEventListener('beforeunload', handleCancel);
  }, [handleCancel]);

  return (
    <LayoutWindow
      renderHeader={() => <HeaderPopup />}
      renderContent={() => (
        <SignMessageContent
          message={message}
          publicKeyHex={signingPublicKeyHex}
        />
      )}
      renderFooter={() => (
        <FooterButtonsContainer>
          <Button color="primaryRed" onClick={handleSign}>
            <Trans t={t}>Sign</Trans>
          </Button>
          <Button color="secondaryBlue" onClick={handleCancel}>
            <Trans t={t}>Cancel</Trans>
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
}
