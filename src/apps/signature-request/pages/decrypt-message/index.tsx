import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { shallowEqual, useSelector } from 'react-redux';

import { ErrorMessages } from '@src/constants';
import { getSigningAccount } from '@src/utils';

import { useAccountManager } from '@popup/hooks/use-account-actions-with-events';

import { closeCurrentWindow } from '@background/close-current-window';
import {
  selectConnectedAccountNamesByOrigin,
  selectVaultAccounts
} from '@background/redux/vault/selectors';
import {
  parseRequestTabId,
  sendSdkResponseToSpecificTab
} from '@background/send-sdk-response-to-specific-tab';

import { sdkMethod } from '@content/sdk-method';

import { decryptEncryptedBase64PrivateKey } from '@libs/crypto';
import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import {
  FooterButtonsContainer,
  HeaderPopup,
  LayoutWindow
} from '@libs/layout';
import { useFetchAccountsInfo } from '@libs/services/account-info';
import { useFetchAccountsBalances } from '@libs/services/balance-service';
import { HardwareWalletType } from '@libs/types/account';
import {
  ApproveConnectionContent,
  Button,
  Typography
} from '@libs/ui/components';
import { getFaviconUrlFromOrigin } from '@libs/ui/components/site-favicon-badge/site-favicon-badge';

import { DecryptMessageContent } from './decrypt-message-content';

export function DecryptMessagePage() {
  const { t } = useTranslation();
  const searchParams = new URLSearchParams(document.location.search);
  const [decryptedMessage, setDecryptedMessage] = useState('');
  const [hasDecryptionError, setHasDecryptionError] = useState(false);

  const requestId = searchParams.get('requestId');
  const requestTabId = parseRequestTabId(searchParams);
  const message = searchParams.get('message');
  const signingPublicKeyHex = searchParams.get('signingPublicKeyHex');
  const requestOrigin = searchParams.get('origin');

  if (
    !requestId ||
    !message ||
    !signingPublicKeyHex ||
    !requestOrigin ||
    requestTabId == null
  ) {
    throw Error(
      `${ErrorMessages.signTransaction.MISSING_SEARCH_PARAM.description} ${requestId} ${message} ${signingPublicKeyHex} ${requestOrigin}`
    );
  }

  const responseSentRef = useRef(false);

  const accounts = useSelector(selectVaultAccounts, shallowEqual);

  const connectedAccountNames = useSelector(
    selectConnectedAccountNamesByOrigin(requestOrigin),
    shallowEqual
  );

  const signingAccount = getSigningAccount(accounts, signingPublicKeyHex);

  if (!signingAccount) {
    const error = Error(
      ErrorMessages.signTransaction.SIGNING_ACCOUNT_MISSING.description
    );
    sendSdkResponseToSpecificTab(
      sdkMethod.signMessageError(error, { requestId }),
      requestTabId
    );
    throw error;
  }

  if (signingAccount.hardware === HardwareWalletType.Ledger) {
    const error = Error(
      ErrorMessages.decryptMessage.LEDGER_NOT_SUPPORTED.description
    );
    sendSdkResponseToSpecificTab(
      sdkMethod.signMessageError(error, { requestId }),
      requestTabId
    );
    throw error;
  }

  const shouldTryToConnectAccount =
    connectedAccountNames &&
    !connectedAccountNames.includes(signingAccount.name);

  const signingAccountHash = getAccountHashFromPublicKey(
    signingAccount.publicKey
  );

  const { accountsBalances, isLoadingBalances } = useFetchAccountsBalances([
    signingAccountHash
  ]);

  const accountsInfo = useFetchAccountsInfo([signingAccount.publicKey]);

  const { connectAnotherAccountWithEvent: connectAnotherAccount } =
    useAccountManager();

  const handleConnect = useCallback(async () => {
    await connectAnotherAccount(signingAccount.name, requestOrigin);
  }, [requestOrigin, connectAnotherAccount, signingAccount.name]);

  const handleCancel = useCallback(() => {
    if (responseSentRef.current) return;
    responseSentRef.current = true;
    sendSdkResponseToSpecificTab(
      sdkMethod.decryptMessageResponse({ cancelled: true }, { requestId }),
      requestTabId
    );
    closeCurrentWindow();
  }, [requestId, requestTabId]);

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

    responseSentRef.current = true;
    sendSdkResponseToSpecificTab(
      sdkMethod.decryptMessageResponse(
        { decryptedMessage, cancelled: false },
        { requestId }
      ),
      requestTabId
    );
    closeCurrentWindow();
  }, [decryptedMessage, requestId, requestTabId]);

  const renderFooter = useCallback(() => {
    if (shouldTryToConnectAccount) {
      return () => (
        <FooterButtonsContainer>
          <Typography type="captionRegular" textAlign={'center'}>
            <Trans t={t}>Only connect with sites you trust</Trans>
          </Typography>
          <Button color="primaryRed" onClick={handleConnect}>
            <Trans t={t}>Connect</Trans>
          </Button>
          <Button color="secondaryBlue" onClick={handleCancel}>
            <Trans t={t}>Cancel</Trans>
          </Button>
        </FooterButtonsContainer>
      );
    }

    return () => (
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
  }, [
    decryptedMessage,
    handleCancel,
    handleConnect,
    handleDecrypt,
    handleSendResponse,
    shouldTryToConnectAccount,
    t
  ]);

  return (
    <LayoutWindow
      renderHeader={() => <HeaderPopup />}
      renderContent={() => {
        if (shouldTryToConnectAccount) {
          return (
            <ApproveConnectionContent
              account={signingAccount}
              accountLiquidBalance={
                accountsBalances?.[signingAccountHash].liquidBalance ?? '0'
              }
              accountsInfo={accountsInfo}
              isLoadingBalance={isLoadingBalances}
              origin={requestOrigin}
              activeOriginFavicon={getFaviconUrlFromOrigin(requestOrigin)}
            />
          );
        }

        return (
          <DecryptMessageContent
            message={message}
            hasDecryptionError={hasDecryptionError}
            decryptedMessage={decryptedMessage}
            publicKeyHex={signingPublicKeyHex}
            origin={requestOrigin}
          />
        );
      }}
      renderFooter={renderFooter()}
    />
  );
}
