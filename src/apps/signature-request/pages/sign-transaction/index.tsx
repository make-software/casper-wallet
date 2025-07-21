import { Transaction } from 'casper-js-sdk';
import {
  isTxSignatureRequestWasmAction,
  isTxSignatureRequestWasmProxyAction
} from 'casper-wallet-core';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { shallowEqual, useSelector } from 'react-redux';
import styled from 'styled-components';

import { ErrorMessages } from '@src/constants';
import { getSigningAccount, isEqualCaseInsensitive } from '@src/utils';

import { useAccountManager } from '@popup/hooks/use-account-actions-with-events';

import { SignatureRequestContent } from '@signature-request/pages/sign-transaction/signature-request-content';
import { SignatureRequestLoading } from '@signature-request/pages/sign-transaction/signature-request-loading';
import { SignatureRequestRawJson } from '@signature-request/pages/sign-transaction/signature-request-raw-json';
import { SigningPageState } from '@signature-request/pages/sign-transaction/types';
import { RouterPath } from '@signature-request/router';

import { closeCurrentWindow } from '@background/close-current-window';
import { selectActiveOriginFavicon } from '@background/redux/active-origin-favicon/selectors';
import { selectActiveOrigin } from '@background/redux/active-origin/selectors';
import { selectIsCasper2Network } from '@background/redux/settings/selectors';
import {
  addWasmToTrusted,
  removeWasmFromTrusted
} from '@background/redux/trusted-wasm/actions';
import { selectTrustedWasmForActiveOrigin } from '@background/redux/trusted-wasm/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
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
import { useFetchDataForSignatureRequest } from '@libs/services/signature-request-service';
import { HardwareWalletType } from '@libs/types/account';
import {
  Button,
  Checkbox,
  LedgerEventView,
  SvgIcon,
  Typography,
  renderLedgerFooter
} from '@libs/ui/components';

const CancelButtonContainer = styled.div`
  display: flex;
  flex: 1;
  max-width: 137px;
`;

export function SignTransactionPage() {
  const { t } = useTranslation();
  const isCasper2Network = useSelector(selectIsCasper2Network);
  const activeOriginFavicon = useSelector(selectActiveOriginFavicon);
  const activeOrigin = useSelector(selectActiveOrigin);
  const accounts = useSelector(selectVaultAccounts, shallowEqual);
  const deployJsonById = useSelector(selectDeploysJsonById, shallowEqual);
  const connectedAccountNames = useSelector(
    selectConnectedAccountNamesWithActiveOrigin,
    shallowEqual
  );
  const activeOriginTrustedWasm = useSelector(
    selectTrustedWasmForActiveOrigin,
    shallowEqual
  );
  const { changeActiveAccountSupportsWithEvent } = useAccountManager();

  const searchParams = new URLSearchParams(document.location.search);
  const isLedgerNewWindow = Boolean(searchParams.get('initialEventToRender'));
  const requestId = searchParams.get('requestId');
  const signingPublicKeyHex = searchParams.get('signingPublicKeyHex');
  const initialEventToRender =
    (searchParams.get('initialEventToRender') as LedgerEventStatus) ??
    LedgerEventStatus.Disconnected;

  const [signingPageState, setSigningPageState] = useState<SigningPageState>(
    isLedgerNewWindow
      ? SigningPageState.LedgerConfirmation
      : SigningPageState.MainContent
  );

  const [transaction, setTransaction] = useState<undefined | Transaction>(
    undefined
  );
  const [wasmApproved, setWasmApproved] = useState<boolean>(false);
  const [additionalApproveRequired, setAdditionalApproveRequired] =
    useState(false);

  const wasmApprovalInitialisedRef = useRef(false);

  const [isSigningAccountFromLedger, setIsSigningAccountFromLedger] =
    useState(false);

  if (!requestId || !signingPublicKeyHex) {
    throw Error(ErrorMessages.signTransaction.MISSING_SEARCH_PARAM.description);
  }

  // it's required to prevent throwing error when active origin changed because of clicked link (e.g. public key)
  const originRef = useRef({
    [requestId]: { activeOrigin, activeOriginFavicon, connectedAccountNames }
  });

  const signingAccount = useMemo(
    () => getSigningAccount(accounts, signingPublicKeyHex),
    [accounts, signingPublicKeyHex]
  );

  const transactionJson = useMemo<string | undefined>(
    () => deployJsonById[requestId],
    [deployJsonById, requestId]
  );

  // signing account should exist in wallet
  if (!signingAccount) {
    const error = Error(
      ErrorMessages.signTransaction.SIGNING_ACCOUNT_MISSING.description
    );
    sendSdkResponseToSpecificTab(sdkMethod.signError(error, { requestId }));
    throw error;
  }

  // signing account should be connected to site
  if (
    !originRef.current[requestId].connectedAccountNames?.includes(
      signingAccount.name
    ) &&
    !isLedgerNewWindow
  ) {
    const error = Error(
      ErrorMessages.signTransaction.ACCOUNT_NOT_CONNECTED.description
    );
    sendSdkResponseToSpecificTab(sdkMethod.signError(error, { requestId }));
    throw error;
  }

  const handlePressShowRawJson = useCallback(() => {
    setSigningPageState(SigningPageState.RowDataContent);
  }, []);

  useEffect(() => {
    setIsSigningAccountFromLedger(
      signingAccount.hardware === HardwareWalletType.Ledger
    );
  }, [signingAccount.hardware]);

  const { signatureRequest, isLoadingSignatureRequest } =
    useFetchDataForSignatureRequest({
      transactionJson,
      signingPublicKeyHex,
      requestId,
      onTransactionParsed: tx => setTransaction(tx)
    });

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
    signingAccount?.publicKey,
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
    beforeLedgerActionCb: async () =>
      setSigningPageState(SigningPageState.LedgerConfirmation),
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
    setSigningPageState(SigningPageState.MainContent);
    closeNewLedgerWindowsAndClearState();
  };

  const maybeRequireApproval = Boolean(
    signatureRequest &&
      (isTxSignatureRequestWasmAction(signatureRequest.action) ||
        isTxSignatureRequestWasmProxyAction(signatureRequest.action)) &&
      !activeOriginTrustedWasm.includes(signatureRequest.action.washHash)
  );

  useEffect(() => {
    if (maybeRequireApproval && !wasmApprovalInitialisedRef.current) {
      setAdditionalApproveRequired(true);
      wasmApprovalInitialisedRef.current = true;
    }
  }, [maybeRequireApproval]);

  const toggleWasmApproval = useCallback(() => {
    if (
      !(
        activeOrigin &&
        signatureRequest &&
        (isTxSignatureRequestWasmAction(signatureRequest.action) ||
          isTxSignatureRequestWasmProxyAction(signatureRequest.action))
      )
    ) {
      return;
    }

    if (wasmApproved) {
      setWasmApproved(false);
      dispatchToMainStore(
        removeWasmFromTrusted({
          origin: activeOrigin,
          wasmHash: signatureRequest.action.washHash
        })
      );
    } else {
      setWasmApproved(true);
      dispatchToMainStore(
        addWasmToTrusted({
          origin: activeOrigin,
          wasmHash: signatureRequest.action.washHash
        })
      );
    }
  }, [activeOrigin, signatureRequest, wasmApproved]);

  const renderFooter = () => {
    if (signingPageState === SigningPageState.LedgerConfirmation) {
      return renderLedgerFooter({
        onConnect: makeSubmitLedgerAction,
        onErrorCtaPressed,
        event: ledgerEventStatusToRender
      });
    }

    return () => (
      <FooterButtonsContainer direction={'column'}>
        {additionalApproveRequired && (
          <AlignedFlexRow gap={SpacingSize.Small}>
            <Checkbox checked={wasmApproved} onChange={toggleWasmApproval} />
            <Typography type={'captionRegular'} color={'contentPrimary'}>
              <Trans>
                I initiated this transaction from a trusted application and
                understand the risks associated with executing WASM
                transactions.
              </Trans>
            </Typography>
          </AlignedFlexRow>
        )}
        <AlignedFlexRow gap={SpacingSize.Medium}>
          <CancelButtonContainer>
            <Button color="secondaryBlue" onClick={handleCancel} flexWidth>
              <Trans t={t}>Cancel</Trans>
            </Button>
          </CancelButtonContainer>
          <Button
            color="primaryRed"
            flexWidth
            disabled={
              !transaction ||
              isLoadingSignatureRequest ||
              (additionalApproveRequired && !wasmApproved)
            }
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
        </AlignedFlexRow>
      </FooterButtonsContainer>
    );
  };

  return (
    <LayoutWindow
      renderHeader={() => (
        <HeaderPopup
          signingAccount={signingAccount}
          renderSubmenuBarItems={
            signingPageState === SigningPageState.LedgerConfirmation ||
            signingPageState === SigningPageState.RowDataContent
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
        isLoadingSignatureRequest ? (
          <SignatureRequestLoading />
        ) : (
          <>
            {signingPageState === SigningPageState.LedgerConfirmation && (
              <LedgerEventView event={ledgerEventStatusToRender} />
            )}

            {signingPageState === SigningPageState.MainContent &&
              signatureRequest && (
                <SignatureRequestContent
                  signatureRequest={signatureRequest}
                  signingPublicKeyHex={signingAccount.publicKey}
                  activeOrigin={
                    originRef.current[requestId].activeOrigin ?? null
                  }
                  activeOriginFavicon={
                    originRef.current[requestId].activeOriginFavicon ?? null
                  }
                  handlePressShowRawJson={handlePressShowRawJson}
                />
              )}

            {signingPageState === SigningPageState.RowDataContent &&
              signatureRequest && (
                <SignatureRequestRawJson json={signatureRequest.rawJson} />
              )}
          </>
        )
      }
      renderFooter={renderFooter()}
    />
  );
}
