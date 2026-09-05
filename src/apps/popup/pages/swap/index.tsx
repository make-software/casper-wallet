import React, { type JSX, useState } from 'react';
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

import { useLedger } from '@hooks/use-ledger';
import { useSubmitButton } from '@hooks/use-submit-button';

import {
  CenteredFlexRow,
  FooterButtonsContainer,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
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

  const [swapStep, setSwapStep] = useState<SwapSteps>(SwapSteps.Form);
  const [review, setReview] = useState<ISwapReviewData | null>(null);

  const { isSubmitButtonDisable, isAdditionalTextVisible } = useSubmitButton(
    swapStep === SwapSteps.Confirm
  );

  const { submit, flowState, isProcessing } = useSwapSubmit({
    review,
    onSubmitted: () => setSwapStep(SwapSteps.Success),
    // A software-key account never emits a `ledger` event, so this only ever fires for a
    // Ledger one — `submit` itself parks the payload before calling it.
    onLedgerStep: () => setSwapStep(SwapSteps.ConfirmWithLedger)
  });

  // Mounted unconditionally, mirroring `transfer`: it opens the permission window itself when
  // the device needs it, regardless of which code path is driving the Ledger interaction.
  const { ledgerEventStatusToRender, makeSubmitLedgerAction } = useLedger({
    ledgerAction: submit,
    beforeLedgerActionCb: async () => {}
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
      onReviewChange={setReview}
    />
  );

  const content: Record<SwapSteps, JSX.Element> = {
    [SwapSteps.Form]: formStep,
    // The form unmounts once Confirm holds a review, so it is the only possible snapshot
    // source; a `null` review here means the step was reached without one, which renders the
    // form again rather than a broken screen.
    [SwapSteps.Confirm]:
      review != null ? (
        <ConfirmStep
          review={review}
          progressRows={hasStartedSubmission ? progressRows : []}
        />
      ) : (
        formStep
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
      <TransferSuccessScreen headerText="You've swapped tokens" />
    )
  };

  const headerButtons: Record<SwapSteps, JSX.Element> = {
    [SwapSteps.Form]: (
      <HeaderSubmenuBarNavLink
        linkType="back"
        backTypeWithBalance
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
          disabled={review == null}
          onClick={() => setSwapStep(SwapSteps.Confirm)}
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
          onClick={submit}
        >
          {isProcessing ? (
            <CenteredFlexRow gap={SpacingSize.Small}>
              <Spinner style={{ marginTop: 0 }} />
              <Trans t={t}>Confirm swap</Trans>
            </CenteredFlexRow>
          ) : (
            <Trans t={t}>Confirm swap</Trans>
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
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={
            swapStep === SwapSteps.Success
              ? undefined
              : () => headerButtons[swapStep]
          }
        />
      )}
      renderContent={() => content[swapStep]}
      renderFooter={() => footerButtons[swapStep]}
    />
  );
};
