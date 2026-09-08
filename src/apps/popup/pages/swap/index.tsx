import React, { type JSX, useEffect, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { HomePageTabName } from '@src/constants';

import { useHomeTab } from '@popup/hooks/use-home-tab';
import { RouterPath, useTypedLocation, useTypedNavigate } from '@popup/router';

import {
  selectAskForReviewAfter,
  selectRatedInStore
} from '@background/redux/rate-app/selectors';
import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';
import { selectIsActiveAccountFromLedger } from '@background/redux/vault/selectors';

import { useLedger } from '@hooks/use-ledger';
import { useSubmitButton } from '@hooks/use-submit-button';

import {
  CenteredFlexRow,
  FooterButtonsContainer,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  NavLinkTokenBalance,
  PopupLayout,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { LedgerEventStatus } from '@libs/services/ledger';
import { useSwapDependencies } from '@libs/services/swap-service';
import {
  Button,
  LedgerEventView,
  Spinner,
  TransferSuccessScreen,
  Typography,
  renderLedgerFooter
} from '@libs/ui/components';

import { ConfirmStep } from './confirm-step';
import { FormStep } from './form-step';
import { ISwapReviewData } from './types';
import { useSwapSubmit } from './use-swap-submit';
import {
  SwapSteps,
  buildSwapProgressRows,
  buildWrapProgressRows,
  getPreviousSwapStep
} from './utils';
import { getReviewMode, swapModeLabels } from './wrap-utils';

const ScrollContainer = styled(VerticalSpaceContainer)<{
  isHidden: boolean;
}>`
  opacity: ${({ isHidden }) => (isHidden ? '0' : '1')};
  height: ${({ isHidden }) => (isHidden ? '0' : '24px')};
  visibility: ${({ isHidden }) => (isHidden ? 'hidden' : 'visible')};
  transition:
    opacity 0.2s ease-in-out,
    height 0.5s ease-in-out;
`;

// The form step stays mounted behind the later steps: its quote hooks own the selected pair
// and the typed amount, and unmounting them empties the form the user comes back to.
const MountedStepContainer = styled.div<{ isHidden: boolean }>`
  display: ${({ isHidden }) => (isHidden ? 'none' : 'contents')};
`;

const ConfirmButtonContainer = styled(FooterButtonsContainer)<{
  isHidden: boolean;
}>`
  gap: ${({ isHidden }) => (isHidden ? '0' : '16px')};
  transition: gap 0.5s ease-in-out;
`;

export const SwapPage = () => {
  const { t } = useTranslation();
  const navigate = useTypedNavigate();
  const { state } = useTypedLocation();
  const { setActiveHomeTab } = useHomeTab();

  const swapDependencies = useSwapDependencies();
  const swapFromTokenId = state?.swapFromTokenId ?? null;

  const ratedInStore = useSelector(selectRatedInStore);
  const askForReviewAfter = useSelector(selectAskForReviewAfter);
  const isLedgerAccount = useSelector(selectIsActiveAccountFromLedger);
  const activeNetworkSetting = useSelector(selectActiveNetworkSetting);

  const [swapStep, setSwapStep] = useState<SwapSteps>(SwapSteps.Form);
  // What the form currently quotes, and the snapshot taken when the user pressed Review. The
  // form keeps requoting while it sits mounted behind the confirm screen, so only the snapshot
  // may drive that screen: the amounts a user reviews must not move under them.
  const [liveReview, setLiveReview] = useState<ISwapReviewData | null>(null);
  const [review, setReview] = useState<ISwapReviewData | null>(null);
  // The form owns the selected pair; the header showing the pay token's balance does not.
  const [payTokenBalance, setPayTokenBalance] =
    useState<NavLinkTokenBalance | null>(null);

  // Confirm without a snapshot cannot render; fall back to the form rather than a broken screen.
  const visibleStep =
    swapStep === SwapSteps.Confirm && review == null
      ? SwapSteps.Form
      : swapStep;

  const { isSubmitButtonDisable, isAdditionalTextVisible } = useSubmitButton(
    visibleStep === SwapSteps.Confirm
  );

  const { submit, parkLedgerPayload, flowState, isProcessing } = useSwapSubmit({
    review,
    onSubmitted: () => setSwapStep(SwapSteps.Success),
    // A software-key account never emits a `ledger` event, so this only ever fires for a
    // Ledger one.
    onLedgerStep: () => setSwapStep(SwapSteps.ConfirmWithLedger)
  });

  // Mounted unconditionally, mirroring `transfer`: it opens the permission window itself when
  // the device needs it, regardless of which code path is driving the Ledger interaction.
  const { ledgerEventStatusToRender, makeSubmitLedgerAction } = useLedger({
    ledgerAction: submit,
    // Parking lives here, not in `submit`: the Connect CTA below dispatches `ledgerStateCleared`
    // before calling this, and with no device connected `submit` never runs at all.
    beforeLedgerActionCb: async () => {
      setSwapStep(SwapSteps.ConfirmWithLedger);
      parkLedgerPayload();
    }
  });
  const ledgerFooterButton = renderLedgerFooter({
    onConnect: makeSubmitLedgerAction,
    event: ledgerEventStatusToRender,
    onErrorCtaPressed: () => setSwapStep(SwapSteps.Confirm)
  });

  // Empty until the flow's first event lands, so `ConfirmStep` keeps showing the details card —
  // see its `progressRows` contract.
  const progressRows =
    review == null
      ? []
      : flowState.kind === 'wrap' && review.kind === 'wrap'
        ? buildWrapProgressRows(flowState.state, review.direction, t)
        : flowState.kind === 'swap'
          ? buildSwapProgressRows(flowState.state, t)
          : [];
  const hasStartedSubmission = progressRows.some(row => row.status !== 'idle');

  const labels =
    swapModeLabels[review == null ? 'swap' : getReviewMode(review)];

  // The switcher is hidden past the form, but the setting is global: another surface can change
  // it mid-review. Start over rather than submit one network's quote to the other's router.
  const entryNetworkRef = useRef(activeNetworkSetting);
  useEffect(() => {
    if (entryNetworkRef.current === activeNetworkSetting) {
      return;
    }

    entryNetworkRef.current = activeNetworkSetting;
    setReview(null);
    setSwapStep(SwapSteps.Form);
  }, [activeNetworkSetting]);

  const goToPreviousStep = () => {
    const previousStep = getPreviousSwapStep(swapStep);

    if (previousStep == null) {
      navigate(-1);
    } else {
      setSwapStep(previousStep);
    }
  };

  const formStep = (
    <FormStep
      swapDependencies={swapDependencies}
      swapFromTokenId={swapFromTokenId}
      onReviewChange={setLiveReview}
      onPayTokenBalanceChange={setPayTokenBalance}
    />
  );

  const content: Record<SwapSteps, JSX.Element> = {
    [SwapSteps.Form]: formStep,
    [SwapSteps.Confirm]:
      review != null ? (
        <ConfirmStep
          review={review}
          progressRows={hasStartedSubmission ? progressRows : []}
        />
      ) : (
        <></>
      ),
    [SwapSteps.ConfirmWithLedger]: (
      <LedgerEventView
        event={
          flowState.state.ledgerEvent ?? {
            status: LedgerEventStatus.WaitingResponseFromDevice
          }
        }
      />
    ),
    [SwapSteps.Success]: (
      <TransferSuccessScreen headerText={labels.successTitle} />
    )
  };

  const headerButtons: Record<SwapSteps, JSX.Element> = {
    [SwapSteps.Form]: (
      <HeaderSubmenuBarNavLink
        linkType="back"
        backTypeWithBalance
        tokenBalance={payTokenBalance}
        onClick={goToPreviousStep}
      />
    ),
    [SwapSteps.Confirm]: (
      <HeaderSubmenuBarNavLink
        linkType="back"
        onClick={() => setSwapStep(SwapSteps.Form)}
      />
    ),
    [SwapSteps.ConfirmWithLedger]: (
      <HeaderSubmenuBarNavLink linkType="back" onClick={goToPreviousStep} />
    ),
    [SwapSteps.Success]: <></>
  };

  const footerButtons: Record<SwapSteps, JSX.Element> = {
    [SwapSteps.Form]: (
      <FooterButtonsContainer>
        <Button
          color="primaryBlue"
          type="button"
          disabled={liveReview == null}
          onClick={() => {
            setReview(liveReview);
            setSwapStep(SwapSteps.Confirm);
          }}
        >
          <Trans t={t}>Review</Trans>
        </Button>
      </FooterButtonsContainer>
    ),
    [SwapSteps.Confirm]: (
      <ConfirmButtonContainer isHidden={!isAdditionalTextVisible}>
        <ScrollContainer isHidden={!isAdditionalTextVisible}>
          <CenteredFlexRow>
            <Typography type="captionRegular">
              <Trans t={t}>Scroll down to check all details</Trans>
            </Typography>
          </CenteredFlexRow>
        </ScrollContainer>
        <Button
          color="primaryBlue"
          type="button"
          disabled={isSubmitButtonDisable || isProcessing}
          onClick={isLedgerAccount ? makeSubmitLedgerAction() : submit}
        >
          {isProcessing ? (
            <CenteredFlexRow gap={SpacingSize.Small}>
              <Spinner style={{ marginTop: 0, marginRight: 12 }} />
              <Trans t={t}>{labels.confirmTitle}</Trans>
            </CenteredFlexRow>
          ) : (
            <Trans t={t}>{labels.confirmTitle}</Trans>
          )}
        </Button>
      </ConfirmButtonContainer>
    ),
    [SwapSteps.ConfirmWithLedger]: ledgerFooterButton ? (
      ledgerFooterButton()
    ) : (
      <></>
    ),
    [SwapSteps.Success]: (
      <FooterButtonsContainer>
        <Button
          color="primaryBlue"
          type="button"
          onClick={() => {
            const currentDate = Date.now();

            const shouldAskForReview =
              askForReviewAfter == null || currentDate > askForReviewAfter;

            // Set once here, before the branch: every exit from RateApp is a
            // post-submission exit, and its `navigate(RouterPath.Home)` calls would
            // otherwise return the user to whatever tab they started the swap from.
            setActiveHomeTab(HomePageTabName.Activity);

            if (ratedInStore || !shouldAskForReview) {
              navigate(RouterPath.Home);
            } else {
              navigate(RouterPath.RateApp);
            }
          }}
        >
          <Trans t={t}>Done</Trans>
        </Button>
      </FooterButtonsContainer>
    )
  };

  return (
    <PopupLayout
      renderHeader={() => (
        <HeaderPopup
          // Past the form, `review` holds a quote whose package hashes and route are specific to
          // the network that produced it, and switching would submit it against the other chain.
          withNetworkSwitcher={visibleStep === SwapSteps.Form}
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={
            visibleStep === SwapSteps.Success
              ? undefined
              : () => headerButtons[visibleStep]
          }
        />
      )}
      renderContent={() => (
        <>
          <MountedStepContainer isHidden={visibleStep !== SwapSteps.Form}>
            {formStep}
          </MountedStepContainer>
          {visibleStep !== SwapSteps.Form && content[visibleStep]}
        </>
      )}
      renderFooter={() => footerButtons[visibleStep]}
    />
  );
};
