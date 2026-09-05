import { Conversions } from 'casper-js-sdk';
import {
  ICasperSigner,
  ISwapFlowDeps,
  ISwapFlowHandle,
  ISwapFlowState,
  IWrapFlowHandle,
  IWrapFlowState,
  createLedgerSigner,
  createPrivateKeySigner,
  createSwapFlowRunner,
  createWrapFlowRunner,
  initialSwapFlowState,
  initialWrapFlowState,
  swapFlowReducer,
  wrapFlowReducer
} from 'casper-wallet-core';
import { useCallback, useEffect, useReducer, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Subscription } from 'rxjs';

import { ErrorMessages, getCasperNetwork } from '@src/constants';

import { useAccountManager } from '@popup/hooks/use-account-actions-with-events';
import { RouterPath, useTypedNavigate } from '@popup/router';

import { fetchAccountSecretKey } from '@background/handlers/vault-secrets';
import { accountPendingDeployHashesChanged } from '@background/redux/account-info/actions';
import { ledgerSwapPayloadChanged } from '@background/redux/ledger/actions';
import {
  selectActiveNetworkSetting,
  selectIsCasper2Network,
  selectSwapDeadlineSetting,
  selectSwapSlippageSetting
} from '@background/redux/settings/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import {
  selectIsActiveAccountFromLedger,
  selectVaultActiveAccount
} from '@background/redux/vault/selectors';
import {
  casperTransactionsRepository,
  dexContractRepository,
  transactionStatusRepository
} from '@background/signing-repositories';

import { CasperWalletSupports } from '@content/sdk-types';

import { createAsymmetricKeys } from '@libs/crypto/create-asymmetric-key';
import { ErrorPath, createErrorLocationState } from '@libs/layout';
import {
  getTransactionErrorCopy,
  isLedgerFailure
} from '@libs/services/core-errors';
import { ledger } from '@libs/services/ledger';

import { ILedgerSwapPayload, serializeLedgerSwapPayload } from './ledger-trade';
import { ISwapReviewData } from './types';

interface UseSwapSubmitParams {
  review: ISwapReviewData | null;
  /** Called once the swap leg has been accepted by a node. */
  onSubmitted: () => void;
  /** Called when a Ledger account starts signing, so the page can show the device step. */
  onLedgerStep: () => void;
}

/** Which flow the hook ran, and its folded state — a swap has an approval leg, a wrap does not. */
export type SwapSubmitState =
  | { kind: 'swap'; state: ISwapFlowState }
  | { kind: 'wrap'; state: IWrapFlowState };

/**
 * Runs the two-leg swap flow or the single-leg wrap flow, whichever `review` names, and folds
 * its `events$` through core's reducer for the matching arm. The runner and its signer are built
 * at submit time — never before, so the secret key's lifetime matches the flow's.
 */
export const useSwapSubmit = ({
  review,
  onSubmitted,
  onLedgerStep
}: UseSwapSubmitParams): {
  submit: () => Promise<void>;
  flowState: SwapSubmitState;
  isProcessing: boolean;
} => {
  const { t } = useTranslation();
  const navigate = useTypedNavigate();
  const { changeActiveAccountSupportsWithEvent } = useAccountManager();

  const [swapState, dispatchSwap] = useReducer(
    swapFlowReducer,
    initialSwapFlowState
  );
  const [wrapState, dispatchWrap] = useReducer(
    wrapFlowReducer,
    initialWrapFlowState
  );

  // Non-null while a flow is live; `submit` returning early when it is set, together with the
  // disabled CTA, is the double-press guard.
  const handleRef = useRef<ISwapFlowHandle | IWrapFlowHandle | null>(null);
  const subscriptionRef = useRef<Subscription | null>(null);
  // Which arm actually ran, pinned once `submit` starts so a later `review` change (there isn't
  // one today, but the confirm screen holds `review` in its parent's state) can't retarget an
  // in-flight flow's rendered rows.
  const runKindRef = useRef<'swap' | 'wrap' | null>(null);

  const activeAccount = useSelector(selectVaultActiveAccount);
  const isLedgerAccount = useSelector(selectIsActiveAccountFromLedger);
  const activeNetworkSetting = useSelector(selectActiveNetworkSetting);
  const network = getCasperNetwork(activeNetworkSetting);
  const isCasper2Network = useSelector(selectIsCasper2Network);
  const slippage = useSelector(selectSwapSlippageSetting);
  const deadline = useSelector(selectSwapDeadlineSetting);

  useEffect(
    () => () => {
      subscriptionRef.current?.unsubscribe();
    },
    []
  );

  const reportFailure = useCallback(
    (error: unknown) => {
      handleRef.current = null;

      // The Ledger views render their own failures; reporting one here would double up.
      if (!isLedgerFailure(error)) {
        const { header, content } = getTransactionErrorCopy(error, key =>
          t(key)
        );

        navigate(
          ErrorPath,
          createErrorLocationState({
            errorHeaderText: header,
            errorContentText: content,
            errorPrimaryButtonLabel: t('Close'),
            errorRedirectPath: RouterPath.Home
          })
        );
      }
    },
    [navigate, t]
  );

  const submit = useCallback(async () => {
    if (handleRef.current != null || review == null || activeAccount == null) {
      return;
    }

    try {
      let signer: ICasperSigner;

      if (isLedgerAccount) {
        // Park the trade the user actually reviewed — including the slippage and deadline in
        // force right now — so the permission window signs it rather than whatever the settings
        // sheet holds by the time it opens.
        const payload: ILedgerSwapPayload =
          review.kind === 'wrap'
            ? {
                kind: 'wrap',
                direction: review.direction,
                rawAmount: review.rawAmount
              }
            : { kind: 'swap', trade: review.trade, slippage, deadline };

        dispatchToMainStore(
          ledgerSwapPayloadChanged(serializeLedgerSwapPayload(payload))
        );
        onLedgerStep();

        signer = createLedgerSigner({
          service: ledger,
          publicKeyHex: activeAccount.publicKey,
          derivationIndex: activeAccount.derivationIndex,
          supportsTransactionV1Cb: changeActiveAccountSupportsWithEvent
        });
      } else {
        const secretKey = await fetchAccountSecretKey(activeAccount.name);

        if (!secretKey) {
          navigate(
            ErrorPath,
            createErrorLocationState({
              errorHeaderText: t(ErrorMessages.common.UNKNOWN_ERROR.message),
              errorContentText: t(
                ErrorMessages.common.UNKNOWN_ERROR.description
              ),
              errorPrimaryButtonLabel: t('Close'),
              errorRedirectPath: RouterPath.Home
            })
          );

          return;
        }

        const keys = createAsymmetricKeys(activeAccount.publicKey, secretKey);

        if (!keys.secretKey) {
          throw new Error('Missing secret key');
        }

        signer = createPrivateKeySigner({
          publicKeyHex: activeAccount.publicKey,
          secretKeyBase64: Conversions.encodeBase64(keys.secretKey.toBytes())
        });
      }

      const supportsTransactionV1 =
        isCasper2Network &&
        (isLedgerAccount
          ? activeAccount.supports?.includes(
              CasperWalletSupports.signTransactionV1
            ) === true
          : true);

      const deps: ISwapFlowDeps = {
        network,
        publicKey: activeAccount.publicKey,
        signer,
        supportsTransactionV1,
        dexContractRepository,
        casperTransactionsRepository,
        transactionStatusRepository,
        // Merged into the flow's events$ so device prompts interleave with its progress.
        ...(isLedgerAccount ? { ledgerEvents$: ledger.ledgerEvents$ } : {})
      };

      runKindRef.current = review.kind;

      if (review.kind === 'wrap') {
        const runner = createWrapFlowRunner(deps);
        const handle = runner.start({
          direction: review.direction,
          rawAmount: review.rawAmount,
          awaitSettlement: false
        });

        handleRef.current = handle;

        const subscription = handle.events$.subscribe({
          next: event => {
            dispatchWrap(event);

            switch (event.type) {
              case 'wrap:sent':
                dispatchToMainStore(
                  accountPendingDeployHashesChanged(event.hash)
                );
                onSubmitted();

                break;

              case 'ledger':
                onLedgerStep();

                break;

              case 'cancelled':
                handleRef.current = null;

                break;

              case 'failed':
                reportFailure(event.error);

                break;

              default:
                break;
            }
          },
          error: err => {
            dispatchWrap({ type: 'failed', error: err });
            reportFailure(err);
          }
        });

        subscriptionRef.current = subscription;

        handle.done
          .finally(() => {
            handleRef.current = null;
          })
          .catch(() => undefined);
      } else {
        const runner = createSwapFlowRunner(deps);
        const handle = runner.start({
          ...review.trade,
          slippage,
          deadline,
          awaitSettlement: false
        });

        handleRef.current = handle;

        const subscription = handle.events$.subscribe({
          next: event => {
            dispatchSwap(event);

            switch (event.type) {
              case 'approval:sent':
              case 'swap:sent':
                // Both legs are the user's own transactions, so both belong in Activity right
                // away.
                dispatchToMainStore(
                  accountPendingDeployHashesChanged(event.hash)
                );

                if (event.type === 'swap:sent') {
                  onSubmitted();
                }

                break;

              case 'ledger':
                onLedgerStep();

                break;

              case 'cancelled':
                // The reducer has already returned the step to `confirm`; releasing the handle
                // is what lets the user press the CTA again.
                handleRef.current = null;

                break;

              case 'failed':
                reportFailure(event.error);

                break;

              default:
                break;
            }
          },
          error: err => {
            dispatchSwap({ type: 'failed', leg: 'swap', error: err });
            reportFailure(err);
          }
        });

        subscriptionRef.current = subscription;

        handle.done
          .finally(() => {
            handleRef.current = null;
          })
          .catch(() => undefined);
      }
    } catch (error) {
      // The Ledger views render their own failures, and the hook that would run this handler
      // for a Ledger account swallows what it throws — so this must leave by the same door.
      if (isLedgerFailure(error)) {
        throw error;
      }

      const { header, content } = getTransactionErrorCopy(error, key => t(key));

      navigate(
        ErrorPath,
        createErrorLocationState({
          errorHeaderText: header,
          errorContentText: content,
          errorPrimaryButtonLabel: t('Close'),
          errorRedirectPath: RouterPath.Home
        })
      );
    }
  }, [
    activeAccount,
    changeActiveAccountSupportsWithEvent,
    deadline,
    isCasper2Network,
    isLedgerAccount,
    navigate,
    network,
    onLedgerStep,
    onSubmitted,
    reportFailure,
    review,
    slippage,
    t
  ]);

  const runKind = runKindRef.current ?? review?.kind ?? 'swap';

  const flowState: SwapSubmitState =
    runKind === 'wrap'
      ? { kind: 'wrap', state: wrapState }
      : { kind: 'swap', state: swapState };

  const isProcessing = flowState.state.step === 'signing';

  return { submit, flowState, isProcessing };
};
