import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { useTypedLocation, useTypedNavigate } from '@popup/router';

import {
  FooterButtonsContainer,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  PopupLayout
} from '@libs/layout';
import { useSwapDependencies } from '@libs/services/swap-service';
import { Button } from '@libs/ui/components';

import { ConfirmStep } from './confirm-step';
import { FormStep } from './form-step';
import { SwapSteps, getPreviousSwapStep } from './utils';

export const SwapPage = () => {
  const { t } = useTranslation();
  const navigate = useTypedNavigate();
  const { state } = useTypedLocation();

  const swapDependencies = useSwapDependencies();
  const swapFromTokenId = state?.swapFromTokenId ?? null;

  const [swapStep, setSwapStep] = useState<SwapSteps>(SwapSteps.Form);

  const [isReviewDisabled, setIsReviewDisabled] = useState(true);

  const goToPreviousStep = () => {
    const previousStep = getPreviousSwapStep(swapStep);

    if (previousStep == null) {
      navigate(-1);
    } else {
      setSwapStep(previousStep);
    }
  };

  const content = {
    [SwapSteps.Form]: (
      <FormStep
        swapDependencies={swapDependencies}
        swapFromTokenId={swapFromTokenId}
        setIsReviewDisabled={setIsReviewDisabled}
      />
    ),
    [SwapSteps.Confirm]: <ConfirmStep />
  };

  const headerButtons = {
    [SwapSteps.Form]: (
      <HeaderSubmenuBarNavLink
        linkType="back"
        backTypeWithBalance
        onClick={goToPreviousStep}
      />
    ),
    [SwapSteps.Confirm]: (
      <HeaderSubmenuBarNavLink linkType="back" onClick={goToPreviousStep} />
    )
  };

  const footerButtons = {
    [SwapSteps.Form]: (
      <FooterButtonsContainer>
        <Button
          color="primaryBlue"
          type="button"
          disabled={isReviewDisabled}
          onClick={() => setSwapStep(SwapSteps.Confirm)}
        >
          <Trans t={t}>Review</Trans>
        </Button>
      </FooterButtonsContainer>
    ),
    [SwapSteps.Confirm]: <></>
  };

  return (
    <PopupLayout
      renderHeader={() => (
        <HeaderPopup
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={() => headerButtons[swapStep]}
        />
      )}
      renderContent={() => content[swapStep]}
      renderFooter={() => footerButtons[swapStep]}
    />
  );
};
