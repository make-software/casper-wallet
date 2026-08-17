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
import { fetchAccountSecretKey } from '@background/handlers/vault-secrets';
import { selectIsCasper2Network } from '@background/redux/settings/selectors';
import {
  addWasmToTrusted,
  removeWasmFromTrusted
} from '@background/redux/trusted-wasm/actions';
import { selectTrustedWasmByOrigin } from '@background/redux/trusted-wasm/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import { getPayload } from '@background/redux/vault/payload-map';
import {
  selectConnectedAccountNamesByOrigin,
  selectDeploysJsonById,
  selectVaultAccounts
} from '@background/redux/vault/selectors';
import {
  parseRequestTabId,
  sendSdkResponseToSpecificTab
} from '@background/send-sdk-response-to-specific-tab';

import { useLedger } from '@hooks/use-ledger';

import { sdkMethod } from '@content/sdk-method';

import { signDeployForProviderResponse } from '@libs/crypto';
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
import { useFetchDataForSignatureRequest } from '@libs/services/signature-request-service';
import { HardwareWalletType } from '@libs/types/account';
import {
  ApproveConnectionContent,
  Button,
  Checkbox,
  LedgerEventView,
  SvgIcon,
  Typography,
  renderLedgerFooter
} from '@libs/ui/components';
import { getFaviconUrlFromOrigin } from '@libs/ui/components/site-favicon-badge/site-favicon-badge';

const CancelButtonContainer = styled.div`
  display: flex;
  flex: 1;
  max-width: 137px;
`;

export function SignTransactionPage() {
  const { t } = useTranslation();
  const isCasper2Network = useSelector(selectIsCasper2Network);
  const accounts = useSelector(selectVaultAccounts, shallowEqual);
  const deployJsonById = useSelector(selectDeploysJsonById, shallowEqual);
  const { changeActiveAccountSupportsWithEvent } = useAccountManager();

  const searchParams = new URLSearchParams(document.location.search);
  const isLedgerNewWindow = Boolean(searchParams.get('initialEventToRender'));
  const requestId = searchParams.get('requestId');
  const requestTabId = parseRequestTabId(searchParams);
  const signingPublicKeyHex = searchParams.get('signingPublicKeyHex');
  const requestOrigin = searchParams.get('origin');
  const initialEventToRender =
    (searchParams.get('initialEventToRender') as LedgerEventStatus) ??
    LedgerEventStatus.Disconnected;

  const connectedAccountNames = useSelector(
    selectConnectedAccountNamesByOrigin(requestOrigin),
    shallowEqual
  );
  const requestOriginTrustedWasm = useSelector(
    selectTrustedWasmByOrigin(requestOrigin),
    shallowEqual
  );

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

  if (
    !requestId ||
    !signingPublicKeyHex ||
    !requestOrigin ||
    requestTabId == null
  ) {
    throw Error(ErrorMessages.signTransaction.MISSING_SEARCH_PARAM.description);
  }

  const signingAccount = useMemo(
    () => getSigningAccount(accounts, signingPublicKeyHex),
    [accounts, signingPublicKeyHex]
  );

  // `getPayload`, never a bare index: `requestId` is dapp-controlled, so
  // `deployJsonById['constructor']` would hand this page an inherited
  // Object.prototype member instead of transaction JSON.
  const transactionJson = useMemo<string | undefined>(
    () => getPayload(deployJsonById, requestId),
    [deployJsonById, requestId]
  );

  // signing account should exist in wallet
  if (!signingAccount) {
    const error = Error(
      ErrorMessages.signTransaction.SIGNING_ACCOUNT_MISSING.description
    );
    sendSdkResponseToSpecificTab(
      sdkMethod.signError(error, { requestId }),
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

  const { accountsBalances, isLoadingBalances } = useFetchAccountsBalances(
    [signingAccountHash],
    transaction?.chainName
  );

  const accountsInfo = useFetchAccountsInfo([signingAccount.publicKey]);

  const { connectAnotherAccountWithEvent: connectAnotherAccount } =
    useAccountManager();

  const handleConnect = useCallback(async () => {
    await connectAnotherAccount(signingAccount.name, requestOrigin);
  }, [requestOrigin, connectAnotherAccount, signingAccount.name]);

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
      requestTabId,
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
      sendSdkResponseToSpecificTab(
        sdkMethod.signError(error, { requestId }),
        requestTabId
      );
      throw error;
    }
  }, [
    isCasper2Network,
    requestId,
    requestTabId,
    signingAccount?.publicKey,
    transaction?.approvals
  ]);

  const handleSign = useCallback(async () => {
    let signature: Uint8Array | null = null;

    if (!transaction) {
      // Every signing route funnels through here, including the Ledger footer's
      // Connect, which is outside the `disabled` gate on the main footer. If the
      // payload is gone the request can never be answered from this window, so
      // returning silently strands both the window and the dapp.
      // Keyed on `transactionJson`: a payload present but not yet parsed is an
      // ordinary in-flight state and must not error out.
      if (!transactionJson) {
        const error = Error(
          ErrorMessages.signTransaction.REQUEST_NO_LONGER_AVAILABLE.description
        );
        sendSdkResponseToSpecificTab(
          sdkMethod.signError(error, { requestId }),
          requestTabId
        );
        closeCurrentWindow();
      }

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
      const secretKey = await fetchAccountSecretKey(signingAccount.name);

      if (!secretKey) {
        const error = Error(
          ErrorMessages.signTransaction.SIGNING_ACCOUNT_MISSING.description
        );
        sendSdkResponseToSpecificTab(
          sdkMethod.signError(error, { requestId }),
          requestTabId
        );
        closeCurrentWindow();
        return;
      }

      signature = signDeployForProviderResponse(
        transaction.hash.toBytes(),
        signingAccount.publicKey,
        secretKey
      );
    }

    if (!signature) {
      return;
    }

    sendSdkResponseToSpecificTab(
      sdkMethod.signResponse(
        { signatureHex: convertBytesToHex(signature), cancelled: false },
        { requestId }
      ),
      requestTabId
    );
    closeCurrentWindow();
  }, [
    transaction,
    transactionJson,
    signingAccount.hardware,
    signingAccount.derivationIndex,
    signingAccount.publicKey,
    signingAccount.name,
    requestId,
    requestTabId,
    changeActiveAccountSupportsWithEvent
  ]);

  const handleCancel = useCallback(() => {
    sendSdkResponseToSpecificTab(
      sdkMethod.signResponse({ cancelled: true }, { requestId }),
      requestTabId
    );
    closeCurrentWindow();
  }, [requestId, requestTabId]);

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
        signingPublicKeyHex,
        origin: requestOrigin,
        tabId: String(requestTabId)
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
    !requestOriginTrustedWasm.includes(signatureRequest.action.washHash)
  );

  useEffect(() => {
    if (maybeRequireApproval && !wasmApprovalInitialisedRef.current) {
      setAdditionalApproveRequired(true);
      wasmApprovalInitialisedRef.current = true;
    }
  }, [maybeRequireApproval]);

  const toggleWasmApproval = useCallback(() => {
    const origin = requestOrigin;

    if (!(
      origin &&
      signatureRequest &&
      (isTxSignatureRequestWasmAction(signatureRequest.action) ||
        isTxSignatureRequestWasmProxyAction(signatureRequest.action))
    )) {
      return;
    }

    if (wasmApproved) {
      setWasmApproved(false);
      dispatchToMainStore(
        removeWasmFromTrusted({
          origin,
          wasmHash: signatureRequest.action.washHash
        })
      );
    } else {
      setWasmApproved(true);
      dispatchToMainStore(
        addWasmToTrusted({
          origin,
          wasmHash: signatureRequest.action.washHash
        })
      );
    }
  }, [requestOrigin, signatureRequest, wasmApproved]);

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
            // `!signatureRequest` mirrors the eip712 page. `transaction` is
            // local state that outlives the payload it was parsed from, so
            // once the answered request's payload is dropped from the vault
            // this button would stay enabled over the empty pane the content
            // branch below renders without a `signatureRequest`.
            disabled={
              !transaction ||
              !signatureRequest ||
              isLoadingSignatureRequest ||
              (additionalApproveRequired && !wasmApproved)
            }
            onClick={
              isSigningAccountFromLedger ? makeSubmitLedgerAction() : handleSign
            }
          >
            {isSigningAccountFromLedger ? (
              <AlignedFlexRow
                gap={SpacingSize.Small}
                style={{ justifyContent: 'center' }}
              >
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

        // `isLoadingSignatureRequest` is the query's `isFetching`, which is
        // false for a DISABLED query — so once the answered request's payload
        // is gone the two content children below are guarded away and this
        // branch rendered an empty pane. Per-request deletion makes that
        // routine, not hypothetical.
        //
        // `LedgerEventView` is the exception and is excluded from the added
        // term: it carries no `signatureRequest`, and it is the only thing the
        // Ledger permission window — the second window, the one that survives a
        // supersede — has to show while the device is being read. Replacing it
        // with a skeleton would blank exactly the screen this fix protects.
        return isLoadingSignatureRequest ||
          (!signatureRequest &&
            signingPageState !== SigningPageState.LedgerConfirmation) ? (
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
                  origin={requestOrigin}
                  handlePressShowRawJson={handlePressShowRawJson}
                />
              )}

            {signingPageState === SigningPageState.RowDataContent &&
              signatureRequest && (
                <SignatureRequestRawJson json={signatureRequest.rawJson} />
              )}
          </>
        );
      }}
      renderFooter={renderFooter()}
    />
  );
}
