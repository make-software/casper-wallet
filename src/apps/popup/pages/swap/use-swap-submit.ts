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
import { ISwapReviewData } from './types';

interface UseSwapSubmitParams {
  review: ISwapReviewData | null;
  /** Called once the swap leg has been accepted by a node. */
  onSubmitted: () => void;
  /** Called when a Ledger account starts signing, so the page can show the device step. */
  onLedgerStep: () => void;
}

export interface ISwapSubmitApi {
  submit: () => Promise<void>;
  /**
   * Stores the reviewed trade for the Ledger permission window. Must run from the page's
   * `beforeLedgerActionCb`: the Connect CTA clears the whole ledger slice before calling it.
   */
  parkLedgerPayload: () => void;
  flowState: SwapSubmitState;
  isProcessing: boolean;
}

/** Which flow the hook ran, and its folded state — a swap has an approval leg, a wrap does not. */
type SwapSubmitState =
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

  // Set synchronously rather than derived from the flow handle: a software-key account awaits a
  // vault round-trip before a runner exists, and a second press in that window would swap twice.
  const isSubmittingRef = useRef(false);
  const subscriptionRef = useRef<Subscription | null>(null);
  // Which arm actually ran, pinned once `submit` starts so a later `review` change (there isn't
  // one today, but the confirm screen holds `review` in its parent's state) can't retarget an
  // in-flight flow's rendered rows.
  const runKindRef = useRef<'swap' | 'wrap' | null>(null);

  const activeAccount = useSelector(selectVaultActiveAccount);
  const isLedgerAccount = useSelector(selectIsActiveAccountFromLedger);
  const permissionWindowId = useSelector(selectLedgerNewWindowId);
  const activeNetworkSetting = useSelector(selectActiveNetworkSetting);
  const network = getCasperNetwork(activeNetworkSetting);
  const isCasper2Network = useSelector(selectIsCasper2Network);
  const slippage = useSelector(selectSwapSlippageSetting);
  const deadline = useSelector(selectSwapDeadlineSetting);

  // Mirrored into refs so the unmount cleanup can stay dependency-free — re-running it on a
  // network or window-id change would drop a payload the permission window is about to sign.
  const permissionWindowIdRef = useRef(permissionWindowId);
  const isLedgerAccountRef = useRef(isLedgerAccount);
  permissionWindowIdRef.current = permissionWindowId;
  isLedgerAccountRef.current = isLedgerAccount;

  // Skipped while a permission window is open, because that window owns the payload and the
  // handlers watching its close clear the whole slice. Otherwise a trade signed inline or
  // abandoned stays parked and is re-run by the next flow that opens the window.
  const clearParkedPayload = useCallback(() => {
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
        case 'sent':
          // Every leg is the user's own transaction, so all of them belong in Activity right
          // away, not only the one the success screen gates on.
          dispatchToMainStore(accountPendingDeployHashesChanged(outcome.hash));

          if (outcome.isSubmitted) {
            clearParkedPayload();
            onSubmitted();
          }

          break;

        case 'ledger':
          onLedgerStep();

          break;

        case 'cancelled':
          // The reducer has already returned the step to `confirm`; releasing the guard is what
          // lets the user press the CTA again, and the retry re-parks through the page.
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
    [clearParkedPayload, onLedgerStep, onSubmitted, reportFailure]
  );

  const parkLedgerPayload = useCallback(() => {
    if (!isLedgerAccount || review == null) {
      return;
    }

    // Snapshots the slippage and deadline in force now, so the permission window signs those
    // rather than whatever the settings sheet holds by the time it opens.
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

        handle.done
          .finally(() => {
            isSubmittingRef.current = false;
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

        handle.done
          .finally(() => {
            isSubmittingRef.current = false;
          })
          .catch(() => undefined);
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
    isCasper2Network,
    isLedgerAccount,
    navigate,
    network,
    onLedgerStep,
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

  return { submit, parkLedgerPayload, flowState, isProcessing };
};
