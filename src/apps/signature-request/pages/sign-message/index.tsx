import React, { useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { shallowEqual, useSelector } from 'react-redux';

import { ErrorMessages } from '@src/constants';
import { getSigningAccount } from '@src/utils';

import { useAccountManager } from '@popup/hooks/use-account-actions-with-events';

import { RouterPath } from '@signature-request/router';

import { closeCurrentWindow } from '@background/close-current-window';
import { fetchAccountSecretKey } from '@background/handlers/vault-secrets';
import {
  selectConnectedAccountNamesByOrigin,
  selectVaultAccounts
} from '@background/redux/vault/selectors';
import {
  parseRequestTabId,
  sendSdkResponseToSpecificTab
} from '@background/send-sdk-response-to-specific-tab';

import { useLedger } from '@hooks/use-ledger';

import { sdkMethod } from '@content/sdk-method';

import { signMessageForProviderResponse } from '@libs/crypto/sign-message';
import { convertBytesToHex } from '@libs/crypto/utils';
import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import {
  AlignedFlexRow,
  FooterButtonsContainer,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  LayoutWindow,
  SpacingSize
} from '@libs/layout';
import { useFetchAccountsInfo } from '@libs/services/account-info';
import { useFetchAccountsBalances } from '@libs/services/balance-service';
import { LedgerEventStatus, ledger } from '@libs/services/ledger';
import { HardwareWalletType } from '@libs/types/account';
import {
  ApproveConnectionContent,
  Button,
  LedgerEventView,
  SvgIcon,
  Typography,
  renderLedgerFooter
} from '@libs/ui/components';
import { getFaviconUrlFromOrigin } from '@libs/ui/components/site-favicon-badge/site-favicon-badge';

import { SignMessageContent } from './sign-message-content';

export function SignMessagePage() {
  const { t } = useTranslation();
  const searchParams = new URLSearchParams(document.location.search);
  const isLedgerNewWindow = Boolean(searchParams.get('initialEventToRender'));
  const [isSigningAccountFromLedger, setIsSigningAccountFromLedger] =
    useState(false);
  const [showLedgerConfirm, setShowLedgerConfirm] =
    useState<boolean>(isLedgerNewWindow);

  const requestId = searchParams.get('requestId');
  const requestTabId = parseRequestTabId(searchParams);
  const message = searchParams.get('message');
  const signingPublicKeyHex = searchParams.get('signingPublicKeyHex');
  const requestOrigin = searchParams.get('origin');
  const initialEventToRender =
    (searchParams.get('initialEventToRender') as LedgerEventStatus) ??
    LedgerEventStatus.Disconnected;

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

  const accounts = useSelector(selectVaultAccounts, shallowEqual);

  const connectedAccountNames = useSelector(
    selectConnectedAccountNamesByOrigin(requestOrigin),
    shallowEqual
  );

  useEffect(() => {
    const signingAccount = getSigningAccount(accounts, signingPublicKeyHex);

    setIsSigningAccountFromLedger(
      signingAccount?.hardware === HardwareWalletType.Ledger
    );
  }, [accounts, signingPublicKeyHex]);

  const signingAccount = getSigningAccount(accounts, signingPublicKeyHex);

  // signing account should exist in wallet
  if (signingAccount == null) {
    const error = Error(
      ErrorMessages.signTransaction.SIGNING_ACCOUNT_MISSING.description
    );
    sendSdkResponseToSpecificTab(
      sdkMethod.signMessageError(error, { requestId }),
      requestTabId
    );
    throw error;
  }

  const shouldTryToConnectAccount =
    connectedAccountNames &&
    !connectedAccountNames.includes(signingAccount.name) &&
    !isLedgerNewWindow;

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

  const handleSign = useCallback(async () => {
    if (message == null) {
      return;
    }

    let signature: Uint8Array;

    if (signingAccount.hardware === HardwareWalletType.Ledger) {
      const resp = await ledger.signMessage(message, {
        index: signingAccount.derivationIndex,
        publicKey: signingAccount.publicKey
      });

      signature = resp.signature;
    } else {
      const secretKey = await fetchAccountSecretKey(signingAccount.name);

      if (!secretKey) {
        const error = Error(
          ErrorMessages.signTransaction.SIGNING_ACCOUNT_MISSING.description
        );
        sendSdkResponseToSpecificTab(
          sdkMethod.signMessageError(error, { requestId }),
          requestTabId
        );
        closeCurrentWindow();
        return;
      }

      signature = signMessageForProviderResponse(
        message,
        signingAccount.publicKey,
        secretKey
      );
    }

    if (!signature) {
      return;
    }

    sendSdkResponseToSpecificTab(
      sdkMethod.signMessageResponse(
        { signatureHex: convertBytesToHex(signature), cancelled: false },
        { requestId }
      ),
      requestTabId
    );
    closeCurrentWindow();
  }, [
    message,
    signingAccount.hardware,
    signingAccount.derivationIndex,
    signingAccount.publicKey,
    signingAccount.name,
    requestId,
    requestTabId
  ]);

  const {
    ledgerEventStatusToRender,
    makeSubmitLedgerAction,
    closeNewLedgerWindowsAndClearState
  } = useLedger({
    ledgerAction: handleSign,
    beforeLedgerActionCb: async () => setShowLedgerConfirm(true),
    withWaitingEventOnDisconnect: false,
    initialEventToRender: { status: initialEventToRender },
    askPermissionUrlData: {
      domain: 'signature-request.html',
      params: {
        requestId,
        signingPublicKeyHex,
        message,
        origin: requestOrigin,
        tabId: String(requestTabId)
      },
      hash: RouterPath.SignMessage
    }
  });

  const onErrorCtaPressed = () => {
    setShowLedgerConfirm(false);
    closeNewLedgerWindowsAndClearState();
  };

  const renderFooter = () => {
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

    if (showLedgerConfirm) {
      return renderLedgerFooter({
        onConnect: makeSubmitLedgerAction,
        onErrorCtaPressed,
        event: ledgerEventStatusToRender
      });
    }

    return () => (
      <FooterButtonsContainer>
        <Button
          color="primaryRed"
          onClick={
            isSigningAccountFromLedger ? makeSubmitLedgerAction() : handleSign
          }
        >
          {isSigningAccountFromLedger ? (
            <AlignedFlexRow gap={SpacingSize.Small}>
              <SvgIcon src="assets/icons/ledger-white.svg" />
              <Trans t={t}>Sign with Ledger</Trans>
            </AlignedFlexRow>
          ) : (
            <Trans t={t}>Sign</Trans>
          )}
        </Button>
        <Button color="secondaryBlue" onClick={handleCancel}>
          <Trans t={t}>Cancel</Trans>
        </Button>
      </FooterButtonsContainer>
    );
  };

  const handleCancel = useCallback(() => {
    sendSdkResponseToSpecificTab(
      sdkMethod.signMessageResponse({ cancelled: true }, { requestId }),
      requestTabId
    );
    closeCurrentWindow();
  }, [requestId, requestTabId]);

  return (
    <LayoutWindow
      renderHeader={() => (
        <HeaderPopup
          renderSubmenuBarItems={
            showLedgerConfirm
              ? () => (
                  <HeaderSubmenuBarNavLink
                    linkType="back"
                    onClick={onErrorCtaPressed}
                  />
                )
              : undefined
          }
        />
      )}
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

        return showLedgerConfirm ? (
          <LedgerEventView event={ledgerEventStatusToRender} />
        ) : (
          <SignMessageContent
            message={message}
            publicKeyHex={signingPublicKeyHex}
            origin={requestOrigin}
          />
        );
      }}
      renderFooter={renderFooter()}
    />
  );
}
