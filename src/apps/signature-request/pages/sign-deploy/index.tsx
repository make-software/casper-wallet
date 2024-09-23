import { DeployUtil } from 'casper-js-sdk';
import {
  getDeployFromJson,
  getTransactionV1FromJson
} from 'casper-wallet-core';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { getSigningAccount } from '@src/utils';

import { SignDeployContent } from '@signature-request/pages/sign-deploy/sign-deploy-content';
import { SignTxContent } from '@signature-request/pages/sign-deploy/sign-tx-content';
import { RouterPath } from '@signature-request/router';

import { closeCurrentWindow } from '@background/close-current-window';
import {
  selectConnectedAccountNamesWithActiveOrigin,
  selectDeploysJsonById,
  selectVaultAccounts
} from '@background/redux/vault/selectors';
import { sendSdkResponseToSpecificTab } from '@background/send-sdk-response-to-specific-tab';

import { useLedger } from '@hooks/use-ledger';

import { sdkMethod } from '@content/sdk-method';

import { signDeploy } from '@libs/crypto';
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

import { CasperDeploy } from './deploy-types';

export function SignDeployPage() {
  const { t } = useTranslation();

  const [deploy, setDeploy] = useState<undefined | CasperDeploy>(undefined);
  const [tx, setTx] = useState<undefined | any>(undefined);

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
    throw Error('Missing search param');
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
    const deployJson = deployJsonById[requestId];
    if (deployJson == null) {
      return;
    }
    console.log('-------- deployJson', deployJson);
    const deploy = getDeployFromJson(JSON.stringify(deployJson));
    const tx = getTransactionV1FromJson(JSON.stringify(deployJson));
    console.log('-------- deploy', deploy);
    console.log('-------- tx', tx);

    if (deploy) {
      // @ts-ignore
      setDeploy(deploy);
    } else if (tx) {
      setTx(tx);
    } else {
      const error = Error('Invalid transaction json');
      sendSdkResponseToSpecificTab(sdkMethod.signError(error, { requestId }));
      throw error;
    }

    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, renderDeps);

  const signingAccount = getSigningAccount(accounts, signingPublicKeyHex);

  // signing account should exist in wallet
  if (signingAccount == null) {
    const error = Error('No signing account');
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
      'Account with signingPublicKeyHex is not connected to site'
    );
    sendSdkResponseToSpecificTab(sdkMethod.signError(error, { requestId }));
    throw error;
  }

  const handleSign = useCallback(async () => {
    let signature: Uint8Array | null = null;

    if (deploy?.hash) {
      if (signingAccount.hardware === HardwareWalletType.Ledger) {
        const resp = await ledger.singDeploy(deploy, {
          index: signingAccount.derivationIndex,
          publicKey: signingAccount.publicKey
        });

        signature = resp.signature;
      } else {
        signature = signDeploy(
          deploy.hash,
          signingAccount.publicKey,
          signingAccount.secretKey
        );
      }
      console.log('-------- signature', signature);
    } else if (tx?.hash) {
      if (signingAccount.hardware === HardwareWalletType.Ledger) {
        signature = null;
      } else {
        signature = signDeploy(
          tx.hash,
          signingAccount.publicKey,
          signingAccount.secretKey
        );
      }

      console.log('-------- tx signature', signature);
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
    deploy,
    tx,
    signingAccount.hardware,
    signingAccount.derivationIndex,
    signingAccount.publicKey,
    signingAccount.secretKey,
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
          disabled={!(deploy || tx)}
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
            {deploy && (
              <SignDeployContent
                deploy={deploy}
                signingPublicKeyHex={signingAccount.publicKey}
              />
            )}
            {tx && (
              <SignTxContent
                tx={tx}
                txJson={deployJsonById[requestId]}
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
