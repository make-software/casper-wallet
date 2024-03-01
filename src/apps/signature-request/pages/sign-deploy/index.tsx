import { DeployUtil } from 'casper-js-sdk';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { getSigningAccount } from '@src/utils';

import { closeCurrentWindow } from '@background/close-current-window';
import {
  selectConnectedAccountNamesWithActiveOrigin,
  selectDeploysJsonById,
  selectVaultAccounts
} from '@background/redux/vault/selectors';
import { sendSdkResponseToSpecificTab } from '@background/send-sdk-response-to-specific-tab';

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
import { HardwareWalletType } from '@libs/types/account';
import {
  Button,
  NoConnectedLedger,
  ReviewWithLedger,
  SvgIcon
} from '@libs/ui/components';

import { CasperDeploy } from './deploy-types';
import { SignDeployContent } from './sign-deploy-content';

export function SignDeployPage() {
  const { t } = useTranslation();

  const [deploy, setDeploy] = useState<undefined | CasperDeploy>(undefined);
  const [isSigningAccountFromLedger, setIsSigningAccountFromLedger] =
    useState(false);
  const [showLedgerConfirm, setShowLedgerConfirm] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLedgerConnected, setIsLedgerConnected] = useState(false);

  const searchParams = new URLSearchParams(document.location.search);
  const requestId = searchParams.get('requestId');
  const signingPublicKeyHex = searchParams.get('signingPublicKeyHex');

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

    const res = DeployUtil.deployFromJson(deployJson);
    if (!res.ok) {
      const error = Error('Parsing deploy from json error');
      sendSdkResponseToSpecificTab(sdkMethod.signError(error, { requestId }));
      throw error;
    }

    setDeploy(res.val);

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
    !connectedAccountNames.includes(signingAccount.name)
  ) {
    const error = Error(
      'Account with signingPublicKeyHex is not connected to site'
    );
    sendSdkResponseToSpecificTab(sdkMethod.signError(error, { requestId }));
    throw error;
  }

  const handleSign = useCallback(() => {
    if (deploy?.hash == null) {
      return;
    }

    const signature = signDeploy(
      deploy.hash,
      signingAccount.publicKey,
      signingAccount.secretKey
    );
    sendSdkResponseToSpecificTab(
      sdkMethod.signResponse(
        { signatureHex: convertBytesToHex(signature), cancelled: false },
        { requestId }
      )
    );
    closeCurrentWindow();
  }, [
    signingAccount?.publicKey,
    signingAccount?.secretKey,
    deploy?.hash,
    requestId
  ]);

  const handleCancel = useCallback(() => {
    sendSdkResponseToSpecificTab(
      sdkMethod.signResponse({ cancelled: true }, { requestId })
    );
    closeCurrentWindow();
  }, [requestId]);

  const handleSignWithLedger = () => {
    setShowLedgerConfirm(true);
  };

  useEffect(() => {
    window.addEventListener('beforeunload', handleCancel);

    return () => window.removeEventListener('beforeunload', handleCancel);
  }, [handleCancel]);

  return (
    <LayoutWindow
      renderHeader={() => (
        <HeaderPopup
          renderSubmenuBarItems={
            showLedgerConfirm && isLedgerConnected
              ? () => (
                  <HeaderSubmenuBarNavLink
                    linkType="cancel"
                    onClick={closeCurrentWindow}
                  />
                )
              : undefined
          }
        />
      )}
      renderContent={() =>
        showLedgerConfirm ? (
          isLedgerConnected ? (
            <ReviewWithLedger
              txnHash={
                '017666eff4fcc0fd656c58dfe2e8fc22b765c05dc8a1be524b1ae4d90634ba9ab5'
              }
            />
          ) : (
            <NoConnectedLedger />
          )
        ) : (
          <SignDeployContent
            deploy={deploy}
            signingPublicKeyHex={signingAccount.publicKey}
          />
        )
      }
      renderFooter={
        showLedgerConfirm
          ? undefined
          : () => (
              <FooterButtonsContainer>
                <Button
                  color="primaryRed"
                  disabled={deploy == null}
                  onClick={
                    isSigningAccountFromLedger
                      ? handleSignWithLedger
                      : handleSign
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
            )
      }
    />
  );
}
