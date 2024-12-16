import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { getSigningAccount } from '@src/utils';

import { RouterPath } from '@signature-request/router';

import { closeCurrentWindow } from '@background/close-current-window';
import {
  selectConnectedAccountNamesWithActiveOrigin,
  selectVaultAccounts
} from '@background/redux/vault/selectors';
import { sendSdkResponseToSpecificTab } from '@background/send-sdk-response-to-specific-tab';

import { useLedger } from '@hooks/use-ledger';

import { sdkMethod } from '@content/sdk-method';

import { signMessage } from '@libs/crypto/sign-message';
import { convertBytesToHex } from '@libs/crypto/utils';
import {
  AlignedFlexRow,
  FooterButtonsContainer,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  LayoutWindow,
  SpacingSize
} from '@libs/layout';
import { LedgerEventStatus, ledger } from '@libs/services/ledger';
import { HardwareWalletType } from '@libs/types/account';
import {
  Button,
  LedgerEventView,
  SvgIcon,
  renderLedgerFooter
} from '@libs/ui/components';

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
  const message = searchParams.get('message');
  const signingPublicKeyHex = searchParams.get('signingPublicKeyHex');
  const initialEventToRender =
    (searchParams.get('initialEventToRender') as LedgerEventStatus) ??
    LedgerEventStatus.Disconnected;

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

  useEffect(() => {
    const signingAccount = getSigningAccount(accounts, signingPublicKeyHex);

    setIsSigningAccountFromLedger(
      signingAccount?.hardware === HardwareWalletType.Ledger
    );
  }, [accounts, signingPublicKeyHex]);

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
    !connectedAccountNames.includes(signingAccount.name) &&
    !isLedgerNewWindow
  ) {
    const error = Error(
      'Account with signingPublicKeyHex is not connected to site'
    );
    sendSdkResponseToSpecificTab(
      sdkMethod.signMessageError(error, { requestId })
    );
    throw error;
  }

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
      signature = await signMessage(
        message,
        signingAccount.publicKey,
        signingAccount.secretKey
      );
    }

    if (!signature) {
      return;
    }

    sendSdkResponseToSpecificTab(
      sdkMethod.signMessageResponse(
        { signatureHex: convertBytesToHex(signature), cancelled: false },
        { requestId }
      )
    );
    closeCurrentWindow();
  }, [
    message,
    signingAccount.hardware,
    signingAccount.derivationIndex,
    signingAccount.publicKey,
    signingAccount.secretKey,
    requestId
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
        message
      },
      hash: RouterPath.SignMessage
    }
  });

  const onErrorCtaPressed = () => {
    setShowLedgerConfirm(false);
    closeNewLedgerWindowsAndClearState();
  };

  const renderFooter = () => {
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
      renderContent={() =>
        showLedgerConfirm ? (
          <LedgerEventView event={ledgerEventStatusToRender} />
        ) : (
          <SignMessageContent
            message={message}
            publicKeyHex={signingPublicKeyHex}
          />
        )
      }
      renderFooter={renderFooter()}
    />
  );
}
