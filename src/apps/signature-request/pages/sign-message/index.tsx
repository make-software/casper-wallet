import React, { useCallback, useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import {
  FooterButtonsContainer,
  LayoutWindow,
  PopupHeader
} from '@libs/layout';
import { closeCurrentWindow } from '@src/background/close-current-window';
import {
  selectConnectedAccountNamesWithOrigin,
  selectVaultAccounts
} from '@src/background/redux/vault/selectors';
import { emitSdkEventToAllActiveTabs } from '@src/content/sdk-event';
import { sdkMessage } from '@src/content/sdk-message';
import { Button } from '@src/libs/ui';

import { SignMessageContent } from './sign-message-content';
import { convertBytesToHex } from '@src/libs/crypto/utils';
import { signMessage } from '@src/libs/crypto/sign-message';

export function SignMessagePage() {
  const { t } = useTranslation();

  const searchParams = new URLSearchParams(document.location.search);
  const requestId = searchParams.get('requestId');
  const message = searchParams.get('message');
  const signingPublicKeyHex = searchParams.get('signingPublicKeyHex');

  if (!requestId || !message || !signingPublicKeyHex) {
    const error = Error(
      `Missing search param: ${requestId} ${message} ${signingPublicKeyHex}`
    );
    throw error;
  }

  const renderDeps = [requestId, signingPublicKeyHex];

  const vaultAccounts = useSelector(selectVaultAccounts);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const accounts = useMemo(() => vaultAccounts, renderDeps);

  const connectedAccountNamesWithOrigin = useSelector(
    selectConnectedAccountNamesWithOrigin
  );
  const connectedAccountNames = useMemo(
    () => connectedAccountNamesWithOrigin,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    renderDeps
  );

  const signingAccount = accounts.find(
    account => account.publicKey === signingPublicKeyHex
  );

  // signing account should exist in wallet
  if (signingAccount == null) {
    const error = Error('No signing account');
    emitSdkEventToAllActiveTabs(
      sdkMessage.signMessageError(error, { requestId })
    );
    throw error;
  }

  // signing account should be connected to site
  if (!connectedAccountNames.includes(signingAccount.name)) {
    const error = Error(
      'Account with signingPublicKeyHex is not connected to site'
    );
    emitSdkEventToAllActiveTabs(
      sdkMessage.signMessageError(error, { requestId })
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
    emitSdkEventToAllActiveTabs(
      sdkMessage.signMessageResponse(
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
    emitSdkEventToAllActiveTabs(
      sdkMessage.signResponse({ cancelled: true }, { requestId })
    );
    closeCurrentWindow();
  }, [requestId]);

  return (
    <LayoutWindow
      renderHeader={() => <PopupHeader withConnectionStatus />}
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
