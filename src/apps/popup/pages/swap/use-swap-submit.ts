import { Conversions } from 'casper-js-sdk';
import {
  ICasperSigner,
  ISwapFlowDeps,
  ISwapFlowState,
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
import { selectLedgerNewWindowId } from '@background/redux/ledger/selectors';
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

import {
  SwapFlowOutcome,
  resolveSwapFlowOutcome,
  resolveWrapFlowOutcome
} from './flow-events';
import { ILedgerSwapPayload, serializeLedgerSwapPayload } from './ledger-trade';
import { toStartSwapFlowParams } from './swap-flow-params';
import { resolveParkedSwapPayload } from './swap-repark';
import { ISwapReviewData } from './types';

interface UseSwapSubmitParams {
  review: ISwapReviewData | null;
  onSubmitted: () => void;
  onLedgerStep: () => void;
}

export interface ISwapSubmitApi {
  submit: () => Promise<void>;
  /**
   * Must run from the page's `beforeLedgerActionCb`: the Connect CTA clears the whole ledger
   * slice before calling it.
   */
  parkLedgerPayload: () => Promise<void>;
  flowState: SwapSubmitState;
  isProcessing: boolean;
}

type SwapSubmitState =
  | { kind: 'swap'; state: ISwapFlowState }
  | { kind: 'wrap'; state: IWrapFlowState };

/**
 * Runs the swap or wrap flow `review` names, folding its `events$` through core's reducer. The
 * runner and its signer are built at submit time, so the secret key's lifetime matches the flow's.
 */
export const useSwapSubmit = ({
  review,
  onSubmitted,
  onLedgerStep
}: UseSwapSubmitParams): ISwapSubmitApi => {
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

  // Set synchronously: before a runner exists, a second press would swap twice.
  const isSubmittingRef = useRef(false);
  const subscriptionRef = useRef<Subscription | null>(null);
  // Pinned once `submit` starts, so a later `review` change can't retarget an in-flight flow.
  const runKindRef = useRef<'swap' | 'wrap' | null>(null);
  // The payload last dispatched to the store, kept so a re-park can amend it (carrying a
  // recorded approval forward) instead of rebuilding it from settings that may have moved on.
  const parkedPayloadRef = useRef<ILedgerSwapPayload | null>(null);

  const activeAccount = useSelector(selectVaultActiveAccount);
  const isLedgerAccount = useSelector(selectIsActiveAccountFromLedger);
  const permissionWindowId = useSelector(selectLedgerNewWindowId);
  const activeNetworkSetting = useSelector(selectActiveNetworkSetting);
  const network = getCasperNetwork(activeNetworkSetting);
  const isCasper2Network = useSelector(selectIsCasper2Network);
  const slippage = useSelector(selectSwapSlippageSetting);
  const deadline = useSelector(selectSwapDeadlineSetting);

  // Also what a re-park's `isDeploy` comes from: the side that waits for a parked approval
  // cannot derive which kind of hash it is waiting on.
  const supportsTransactionV1 =
    isCasper2Network &&
    (isLedgerAccount
      ? activeAccount?.supports?.includes(
          CasperWalletSupports.signTransactionV1
        ) === true
      : true);

  // Mirrored into refs so the unmount cleanup can stay dependency-free.
  const permissionWindowIdRef = useRef(permissionWindowId);
  const isLedgerAccountRef = useRef(isLedgerAccount);
  permissionWindowIdRef.current = permissionWindowId;
  isLedgerAccountRef.current = isLedgerAccount;

  // Skipped while a permission window is open: that window owns the payload.
  const clearParkedPayload = useCallback(() => {
    parkedPayloadRef.current = null;

    if (isLedgerAccountRef.current && permissionWindowIdRef.current == null) {
      dispatchToMainStore(ledgerSwapPayloadChanged(null));
    }
  }, []);

  useEffect(
    () => () => {
      subscriptionRef.current?.unsubscribe();
      clearParkedPayload();
    },
    [clearParkedPayload]
  );

  const reportFailure = useCallback(
    (error: unknown) => {
      isSubmittingRef.current = false;

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

  const applyOutcome = useCallback(
    (outcome: SwapFlowOutcome) => {
      switch (outcome.kind) {
        case 'sent': {
          // Every leg is the user's own transaction, so all of them belong in Activity.
          dispatchToMainStore(accountPendingDeployHashesChanged(outcome.hash));

          if (outcome.isSubmitted) {
            clearParkedPayload();
            onSubmitted();

            break;
          }

          // The approval leg re-parks, carrying its hash so a device interruption before the
          // swap leg waits for it instead of paying for a second one.
          const nextParked = resolveParkedSwapPayload(
            outcome,
            parkedPayloadRef.current,
            !supportsTransactionV1
          );

          if (nextParked !== undefined) {
            parkedPayloadRef.current = nextParked;

            dispatchToMainStore(
              ledgerSwapPayloadChanged(
                nextParked == null
                  ? null
                  : serializeLedgerSwapPayload(nextParked)
              )
            );
          }

          break;
        }

        case 'ledger':
          onLedgerStep();

          break;

        case 'cancelled':
          // Releasing the guard lets the user press the CTA again; the retry re-parks via the page.
          isSubmittingRef.current = false;
          clearParkedPayload();

          break;

        case 'failed':
          reportFailure(outcome.error);

          break;

        default:
          break;
      }
    },
    [
      clearParkedPayload,
      onLedgerStep,
      onSubmitted,
      reportFailure,
      supportsTransactionV1
    ]
  );

  const parkLedgerPayload = useCallback(async () => {
    if (!isLedgerAccount || review == null) {
      return;
    }

    // A resumed attempt carries forward whatever approval the previous one already recorded.
    const previouslyParked = parkedPayloadRef.current;
    const pendingApproval =
      review.kind === 'swap' && previouslyParked?.kind === 'swap'
        ? previouslyParked.pendingApproval
        : undefined;

    // Snapshots the slippage and deadline in force now, not what the settings sheet holds later.
    const payload: ILedgerSwapPayload =
      review.kind === 'wrap'
        ? {
            kind: 'wrap',
            direction: review.direction,
            rawAmount: review.rawAmount
          }
        : {
            kind: 'swap',
            trade: review.trade,
            slippage,
            deadline,
            ...(pendingApproval ? { pendingApproval } : {})
          };

    parkedPayloadRef.current = payload;

    await dispatchToMainStore(
      ledgerSwapPayloadChanged(serializeLedgerSwapPayload(payload))
    );
  }, [deadline, isLedgerAccount, review, slippage]);

  const submit = useCallback(async () => {
    if (isSubmittingRef.current || review == null || activeAccount == null) {
      return;
    }

    isSubmittingRef.current = true;

    try {
      let signer: ICasperSigner;

      if (isLedgerAccount) {
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

          isSubmittingRef.current = false;

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

        const subscription = handle.events$.subscribe({
          next: event => {
            dispatchWrap(event);
            applyOutcome(resolveWrapFlowOutcome(event));
          },
          error: err => {
            dispatchWrap({ type: 'failed', error: err });
            reportFailure(err);
          }
        });

        subscriptionRef.current = subscription;

        // Awaited so this call spans the flow: a Ledger resume keys off the outstanding action.
        await handle.done.catch(() => undefined);
        isSubmittingRef.current = false;
      } else {
        const runner = createSwapFlowRunner(deps);
        // Carries forward whatever the previous attempt recorded, so a retry after a failure
        // waits for that approval instead of paying for a second one.
        const pendingApproval =
          parkedPayloadRef.current?.kind === 'swap'
            ? parkedPayloadRef.current.pendingApproval
            : undefined;
        const handle = runner.start(
          toStartSwapFlowParams({
            kind: 'swap',
            trade: review.trade,
            slippage,
            deadline,
            ...(pendingApproval ? { pendingApproval } : {})
          })
        );

        const subscription = handle.events$.subscribe({
          next: event => {
            dispatchSwap(event);
            applyOutcome(resolveSwapFlowOutcome(event));
          },
          error: err => {
            dispatchSwap({ type: 'failed', leg: 'swap', error: err });
            reportFailure(err);
          }
        });

        subscriptionRef.current = subscription;

        await handle.done.catch(() => undefined);
        isSubmittingRef.current = false;
      }
    } catch (error) {
      isSubmittingRef.current = false;

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
    applyOutcome,
    changeActiveAccountSupportsWithEvent,
    deadline,
    isLedgerAccount,
    navigate,
    network,
    onLedgerStep,
    reportFailure,
    review,
    slippage,
    supportsTransactionV1,
    t
  ]);

  const runKind = runKindRef.current ?? review?.kind ?? 'swap';

  const flowState: SwapSubmitState =
    runKind === 'wrap'
      ? { kind: 'wrap', state: wrapState }
      : { kind: 'swap', state: swapState };

  const isProcessing = flowState.state.step === 'signing';

  return { submit, parkLedgerPayload, flowState, isProcessing };
};
