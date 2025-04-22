import { Transaction } from 'casper-js-sdk';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { ErrorMessages } from '@src/constants';
import { getSigningAccount, isEqualCaseInsensitive } from '@src/utils';

import { useAccountManager } from '@popup/hooks/use-account-actions-with-events';

import { SignDeployContent } from '@signature-request/pages/sign-deploy/sign-deploy-content';
import { RouterPath } from '@signature-request/router';

import { closeCurrentWindow } from '@background/close-current-window';
import { selectIsCasper2Network } from '@background/redux/settings/selectors';
import {
  selectConnectedAccountNamesWithActiveOrigin,
  selectDeploysJsonById,
  selectVaultAccounts
} from '@background/redux/vault/selectors';
import { sendSdkResponseToSpecificTab } from '@background/send-sdk-response-to-specific-tab';

import { useLedger } from '@hooks/use-ledger';

import { sdkMethod } from '@content/sdk-method';

import { signDeployForProviderResponse } from '@libs/crypto';
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

export function SignDeployPage() {
  const { t } = useTranslation();
  const isCasper2Network = useSelector(selectIsCasper2Network);
  const { changeActiveAccountSupportsWithEvent } = useAccountManager();

  const [transaction, setTransaction] = useState<undefined | Transaction>(
    undefined
  );

  const [isSigningAccountFromLedger, setIsSigningAccountFromLedger] =
    useState(false);

  const searchParams = new URLSearchParams(document.location.search);
  const isLedgerNewWindow = Boolean(searchParams.get('initialEventToRender'));
  const requestId = searchParams.get('requestId');
  const signingPublicKeyHex = searchParams.get('signingPublicKeyHex');
  const initialEventToRender =
    (searchParams.get('initialEventToRender') as LedgerEventStatus) ??
    LedgerEventStatus.Disconnected;
  const [showLedgerConfirm, setShowLedgerConfirm] =
    useState<boolean>(isLedgerNewWindow);

  if (!requestId || !signingPublicKeyHex) {
    throw Error(ErrorMessages.signTransaction.MISSING_SEARCH_PARAM.description);
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

  const deployJsonById = useSelector(selectDeploysJsonById);

  useEffect(() => {
    try {
      const deployJson = deployJsonById[requestId];

      if (deployJson == null) {
        return;
      }

      const tx = Transaction.fromJSON(deployJson);
      setTransaction(tx);
    } catch (e) {
      const error = Error(
        ErrorMessages.signTransaction.INVALID_TRANSACTION_JSON.description
      );
      sendSdkResponseToSpecificTab(sdkMethod.signError(error, { requestId }));
      throw error;
    }

    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, renderDeps);

  const signingAccount = getSigningAccount(accounts, signingPublicKeyHex);

  // signing account should exist in wallet
  if (signingAccount == null) {
    const error = Error(
      ErrorMessages.signTransaction.SIGNING_ACCOUNT_MISSING.description
    );
    sendSdkResponseToSpecificTab(sdkMethod.signError(error, { requestId }));
    throw error;
  }

  // signing account should be connected to site
  if (
    connectedAccountNames != null &&
    !connectedAccountNames.includes(signingAccount.name) &&
    !isLedgerNewWindow
  ) {
    const error = Error(
      ErrorMessages.signTransaction.ACCOUNT_NOT_CONNECTED.description
    );
    sendSdkResponseToSpecificTab(sdkMethod.signError(error, { requestId }));
    throw error;
  }

  useEffect(() => {
    const isAlreadySigned = transaction?.approvals.some(apr =>
      isEqualCaseInsensitive(apr.signer.toHex(), signingAccount.publicKey)
    );

    if (isAlreadySigned) {
      const error = Error(
        `The ${
          isCasper2Network ? 'Transaction' : 'Deploy'
        } has already been signed with this account`
      );
      sendSdkResponseToSpecificTab(sdkMethod.signError(error, { requestId }));
      throw error;
    }
  }, [
    isCasper2Network,
    requestId,
    signingAccount.publicKey,
    transaction?.approvals
  ]);

  const handleSign = useCallback(async () => {
    let signature: Uint8Array | null = null;

    if (!transaction) {
      return;
    }

    if (signingAccount.hardware === HardwareWalletType.Ledger) {
      const resp = await ledger.signTransaction(
        transaction,
        {
          index: signingAccount.derivationIndex,
          publicKey: signingAccount.publicKey
        },
        changeActiveAccountSupportsWithEvent
      );

      signature = resp.signature;
    } else {
      signature = signDeployForProviderResponse(
        transaction.hash.toBytes(),
        signingAccount.publicKey,
        signingAccount.secretKey
      );
    }

    if (!signature) {
      return;
    }

    sendSdkResponseToSpecificTab(
      sdkMethod.signResponse(
        { signatureHex: convertBytesToHex(signature), cancelled: false },
        { requestId }
      )
    );
    closeCurrentWindow();
  }, [
    transaction,
    signingAccount.hardware,
    signingAccount.derivationIndex,
    signingAccount.publicKey,
    signingAccount.secretKey,
    requestId,
    changeActiveAccountSupportsWithEvent
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

  const {
    ledgerEventStatusToRender,
    makeSubmitLedgerAction,
    closeNewLedgerWindowsAndClearState
  } = useLedger({
    ledgerAction: handleSign,
    beforeLedgerActionCb: async () => setShowLedgerConfirm(true),
    initialEventToRender: { status: initialEventToRender },
    withWaitingEventOnDisconnect: false,
    askPermissionUrlData: {
      domain: 'signature-request.html',
      params: {
        requestId,
        signingPublicKeyHex
      },
      hash: RouterPath.SignDeploy
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
          disabled={!transaction}
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
          <>
            {transaction && (
              <SignDeployContent
                tx={transaction}
                signingPublicKeyHex={signingAccount.publicKey}
              />
            )}
          </>
        )
      }
      renderFooter={renderFooter()}
    />
  );
}
