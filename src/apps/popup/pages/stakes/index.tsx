import { Deploy } from 'casper-js-sdk';
import { formatNumber } from 'casper-wallet-core';
import { ValidatorDto } from 'casper-wallet-core/src/data/dto/validators';
import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import {
  AuctionManagerEntryPoint,
  STAKE_COST_MOTES,
  StakeSteps,
  networkNameToSdkNetworkNameMap
} from '@src/constants';

import { AmountStep } from '@popup/pages/stakes/amount-step';
import { ConfirmStep } from '@popup/pages/stakes/confirm-step';
import { NoDelegations } from '@popup/pages/stakes/no-delegations';
import { RedelegateValidatorDropdownInput } from '@popup/pages/stakes/redelegate-validator-dropdown-input';
import { Step } from '@popup/pages/stakes/step';
import {
  useConfirmationButtonText,
  useStakeActionTexts,
  useStakeType
} from '@popup/pages/stakes/utils';
import { ValidatorDropdownInput } from '@popup/pages/stakes/validator-dropdown-input';
import { RouterPath, useTypedNavigate } from '@popup/router';

import { accountPendingDeployHashesChanged } from '@background/redux/account-info/actions';
import {
  ledgerDeployChanged,
  ledgerTransactionChanged
} from '@background/redux/ledger/actions';
import {
  selectAskForReviewAfter,
  selectRatedInStore
} from '@background/redux/rate-app/selectors';
import {
  selectApiConfigBasedOnActiveNetwork,
  selectCasperNetworkApiVersion,
  selectIsCasper2Network
} from '@background/redux/settings/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import {
  selectIsActiveAccountFromLedger,
  selectVaultActiveAccount
} from '@background/redux/vault/selectors';

import { useLedger } from '@hooks/use-ledger';
import { useSubmitButton } from '@hooks/use-submit-button';

import { createAsymmetricKeys } from '@libs/crypto/create-asymmetric-key';
import {
  AlignedFlexRow,
  CenteredFlexRow,
  ErrorPath,
  FooterButtonsContainer,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  ParagraphContainer,
  PopupLayout,
  SpaceBetweenFlexRow,
  SpacingSize,
  VerticalSpaceContainer,
  createErrorLocationState
} from '@libs/layout';
import { useFetchWalletBalance } from '@libs/services/balance-service';
import {
  getDateForDeploy,
  sendSignedTx,
  signTx
} from '@libs/services/deployer-service';
import { buildAuctionTransactions } from '@libs/services/tx-builders';
import {
  Button,
  HomePageTabsId,
  LedgerEventView,
  SvgIcon,
  TransferSuccessScreen,
  Typography,
  renderLedgerFooter
} from '@libs/ui/components';
import { calculateSubmitButtonDisabled } from '@libs/ui/forms/get-submit-button-state-from-validation';
import { useStakesForm } from '@libs/ui/forms/stakes-form';
import { CSPRtoMotes, motesToCSPR } from '@libs/ui/utils';

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

export const StakesPage = () => {
  const [stakeStep, setStakeStep] = useState(StakeSteps.Validator);
  const [validatorPublicKey, setValidatorPublicKey] = useState('');
  const [newValidatorPublicKey, setNewValidatorPublicKey] = useState('');
  const [inputAmountCSPR, setInputAmountCSPR] = useState('');
  const [validator, setValidator] = useState<ValidatorDto | null>(null);
  const [newValidator, setNewValidator] = useState<ValidatorDto | null>(null);
  const [stakeAmountMotes, setStakeAmountMotes] = useState('');
  const isCasper2Network = useSelector(selectIsCasper2Network);
  const casperNetworkApiVersion = useSelector(selectCasperNetworkApiVersion);

  const activeAccount = useSelector(selectVaultActiveAccount);
  const isActiveAccountFromLedger = useSelector(
    selectIsActiveAccountFromLedger
  );
  const { networkName, nodeUrl } = useSelector(
    selectApiConfigBasedOnActiveNetwork
  );
  const ratedInStore = useSelector(selectRatedInStore);
  const askForReviewAfter = useSelector(selectAskForReviewAfter);

  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  const { accountBalance } = useFetchWalletBalance();

  const { stakeType, validatorList, undelegateValidatorList, loading } =
    useStakeType();

  const hasDelegationToSelectedValidator = undelegateValidatorList?.some(
    accountDelegation => accountDelegation.publicKey === validator?.publicKey
  );
  const hasDelegationToSelectedNewValidator = undelegateValidatorList?.some(
    accountDelegation => accountDelegation.publicKey === newValidator?.publicKey
  );

  const { amountForm, validatorForm, newValidatorForm } = useStakesForm(
    accountBalance.liquidBalance,
    stakeType,
    stakeAmountMotes,
    validator,
    newValidator,
    inputAmountCSPR,
    hasDelegationToSelectedValidator,
    hasDelegationToSelectedNewValidator
  );
  const { formState: amountFormState, getValues: getValuesAmountForm } =
    amountForm;
  const { formState: validatorFormState, getValues: getValuesValidatorForm } =
    validatorForm;
  const {
    formState: newValidatorFormState,
    getValues: getValuesNewValidatorForm
  } = newValidatorForm;

  const {
    isSubmitButtonDisable,
    setIsSubmitButtonDisable,
    isAdditionalTextVisible
  } = useSubmitButton(stakeStep === StakeSteps.Confirm);

  const submitStake = async () => {
    setIsSubmitButtonDisable(true);

    if (activeAccount) {
      const motesAmount = CSPRtoMotes(inputAmountCSPR);

      const KEYS = createAsymmetricKeys(
        activeAccount.publicKey,
        activeAccount.secretKey
      );

      const timestamp = await getDateForDeploy(nodeUrl);

      const { transaction, fallbackDeploy } = buildAuctionTransactions(
        {
          amount: motesAmount,
          chainName: networkNameToSdkNetworkNameMap[networkName],
          contractEntryPoint: stakeType,
          delegatorPublicKeyHex: activeAccount.publicKey,
          newValidatorPublicKeyHex: newValidatorPublicKey,
          validatorPublicKeyHex: validatorPublicKey,
          timestamp
        },
        casperNetworkApiVersion
      );

      const signedTx = await signTx(
        transaction,
        KEYS,
        activeAccount,
        fallbackDeploy
      );

      sendSignedTx(signedTx, nodeUrl, isCasper2Network)
        .then(hash => {
          dispatchToMainStore(accountPendingDeployHashesChanged(hash));
          setStakeStep(StakeSteps.Success);
        })
        .catch(error => {
          console.error(error, 'staking request error');

          navigate(
            ErrorPath,
            createErrorLocationState({
              errorHeaderText: error.message || t('Something went wrong'),
              errorContentText:
                typeof error.data === 'string'
                  ? error.data
                  : t(
                      'Please check browser console for error details, this will be a valuable for our team to fix the issue.'
                    ),
              errorPrimaryButtonLabel: t('Close'),
              errorRedirectPath: RouterPath.Home
            })
          );
        });
    }
  };

  const beforeLedgerActionCb = async () => {
    setStakeStep(StakeSteps.ConfirmWithLedger);

    if (activeAccount) {
      const motesAmount = CSPRtoMotes(inputAmountCSPR);

      const timestamp = await getDateForDeploy(nodeUrl);

      const { transaction, fallbackDeploy } = buildAuctionTransactions(
        {
          amount: motesAmount,
          chainName: networkNameToSdkNetworkNameMap[networkName],
          contractEntryPoint: stakeType,
          delegatorPublicKeyHex: activeAccount.publicKey,
          newValidatorPublicKeyHex: newValidatorPublicKey,
          validatorPublicKeyHex: validatorPublicKey,
          timestamp
        },
        casperNetworkApiVersion
      );

      dispatchToMainStore(
        ledgerTransactionChanged(JSON.stringify(transaction.toJSON()))
      );
      dispatchToMainStore(
        ledgerDeployChanged(JSON.stringify(Deploy.toJSON(fallbackDeploy)))
      );
    }
  };

  const { ledgerEventStatusToRender, makeSubmitLedgerAction } = useLedger({
    ledgerAction: submitStake,
    beforeLedgerActionCb
  });

  const isValidatorFormButtonDisabled = calculateSubmitButtonDisabled({
    isValid: validatorFormState.isValid
  });
  const isAmountFormButtonDisabled = calculateSubmitButtonDisabled({
    isValid: amountFormState.isValid
  });
  const isNewValidatorFormButtonDisabled = calculateSubmitButtonDisabled({
    isValid: newValidatorFormState.isValid
  });

  const {
    validatorStepHeaderText,
    newValidatorStepHeaderText,
    amountStepHeaderText,
    confirmStepHeaderText,
    successStepHeaderText,
    confirmStepText,
    amountStepText,
    amountStepMaxAmountValue
  } = useStakeActionTexts(stakeType, stakeAmountMotes);

  const confirmButtonText = useConfirmationButtonText(stakeType);

  const content = {
    [StakeSteps.Validator]: (
      <Step headerText={validatorStepHeaderText}>
        <ValidatorDropdownInput
          validatorForm={validatorForm}
          validatorList={
            stakeType === AuctionManagerEntryPoint.delegate
              ? validatorList
              : undelegateValidatorList
          }
          validator={validator}
          setValidator={setValidator}
          setStakeAmount={setStakeAmountMotes}
          stakeType={stakeType}
          loading={loading}
        />
      </Step>
    ),
    [StakeSteps.Amount]: (
      <Step headerText={amountStepHeaderText}>
        <AmountStep
          amountForm={amountForm}
          stakeType={stakeType}
          stakeAmountMotes={stakeAmountMotes}
          amountStepText={amountStepText}
          amountStepMaxAmountValue={amountStepMaxAmountValue}
        />
      </Step>
    ),
    [StakeSteps.NewValidator]: (
      <Step headerText={newValidatorStepHeaderText!}>
        <ParagraphContainer top={SpacingSize.Medium}>
          <AlignedFlexRow gap={SpacingSize.Small}>
            <Typography type="body" color="contentSecondary">
              <Trans t={t}>Amount:</Trans>
            </Typography>
            <Typography type="bodyHash">{`${inputAmountCSPR} CSPR`}</Typography>
          </AlignedFlexRow>
        </ParagraphContainer>
        <RedelegateValidatorDropdownInput
          newValidatorForm={newValidatorForm}
          validatorList={validatorList}
          validator={newValidator}
          setValidator={setNewValidator}
          setStakeAmount={setStakeAmountMotes}
        />
      </Step>
    ),
    [StakeSteps.Confirm]: (
      <Step headerText={confirmStepHeaderText}>
        <ConfirmStep
          newValidator={newValidator}
          validator={validator}
          inputAmountCSPR={inputAmountCSPR}
          stakeType={stakeType}
          confirmStepText={confirmStepText}
        />
      </Step>
    ),
    [StakeSteps.ConfirmWithLedger]: (
      <LedgerEventView event={ledgerEventStatusToRender} />
    ),
    [StakeSteps.Success]: (
      <TransferSuccessScreen headerText={successStepHeaderText}>
        {stakeType === AuctionManagerEntryPoint.redelegate ? (
          <VerticalSpaceContainer top={SpacingSize.Medium}>
            <Typography type="body" color="contentSecondary">
              <Trans t={t}>
                I usually takes around{' '}
                <Typography type="bodySemiBold">14 to 16 hours</Typography> for
                this operation to complete.
              </Trans>
            </Typography>
          </VerticalSpaceContainer>
        ) : null}
      </TransferSuccessScreen>
    )
  };

  const headerButtons = {
    [StakeSteps.Validator]: (
      <HeaderSubmenuBarNavLink linkType="back" backTypeWithBalance />
    ),
    [StakeSteps.Amount]: (
      <HeaderSubmenuBarNavLink
        linkType="back"
        backTypeWithBalance
        onClick={() => setStakeStep(StakeSteps.Validator)}
      />
    ),
    [StakeSteps.NewValidator]: (
      <HeaderSubmenuBarNavLink
        linkType="back"
        backTypeWithBalance
        onClick={() => setStakeStep(StakeSteps.Amount)}
      />
    ),
    [StakeSteps.Confirm]: (
      <HeaderSubmenuBarNavLink
        linkType="back"
        backTypeWithBalance
        onClick={() =>
          stakeType === AuctionManagerEntryPoint.redelegate
            ? setStakeStep(StakeSteps.NewValidator)
            : setStakeStep(StakeSteps.Amount)
        }
      />
    ),
    [StakeSteps.ConfirmWithLedger]: (
      <HeaderSubmenuBarNavLink
        linkType="back"
        onClick={() => setStakeStep(StakeSteps.Confirm)}
      />
    )
  };

  const ledgerFooterButton = renderLedgerFooter({
    onConnect: makeSubmitLedgerAction,
    event: ledgerEventStatusToRender,
    onErrorCtaPressed: () => setStakeStep(StakeSteps.Confirm)
  });

  const footerButtons = {
    [StakeSteps.Validator]: (
      <FooterButtonsContainer>
        <Button
          color="primaryBlue"
          type="button"
          disabled={isValidatorFormButtonDisabled}
          onClick={() => {
            const { validatorPublicKey } = getValuesValidatorForm();

            setStakeStep(StakeSteps.Amount);
            setValidatorPublicKey(validatorPublicKey);
          }}
        >
          <Trans t={t}>Next</Trans>
        </Button>
      </FooterButtonsContainer>
    ),
    [StakeSteps.Amount]: (
      <FooterButtonsContainer>
        <SpaceBetweenFlexRow>
          <Typography type="captionRegular" color="contentSecondary">
            <Trans t={t}>Transaction fee</Trans>
          </Typography>
          <Typography type="captionHash">
            {formatNumber(motesToCSPR(STAKE_COST_MOTES), {
              precision: { max: 5 }
            })}{' '}
            CSPR
          </Typography>
        </SpaceBetweenFlexRow>
        <Button
          color="primaryBlue"
          type="button"
          disabled={isAmountFormButtonDisabled}
          onClick={() => {
            const { amount: _amount } = getValuesAmountForm();

            setInputAmountCSPR(_amount);
            if (stakeType === AuctionManagerEntryPoint.redelegate) {
              setStakeStep(StakeSteps.NewValidator);
            } else {
              setStakeStep(StakeSteps.Confirm);
            }
          }}
        >
          <Trans t={t}>Next</Trans>
        </Button>
      </FooterButtonsContainer>
    ),
    [StakeSteps.NewValidator]: (
      <FooterButtonsContainer>
        <Button
          color="primaryBlue"
          type="button"
          disabled={isNewValidatorFormButtonDisabled}
          onClick={() => {
            const { newValidatorPublicKey: _newValidatorPublicKey } =
              getValuesNewValidatorForm();

            setNewValidatorPublicKey(_newValidatorPublicKey);
            setStakeStep(StakeSteps.Confirm);
          }}
        >
          <Trans t={t}>Next</Trans>
        </Button>
      </FooterButtonsContainer>
    ),
    [StakeSteps.Confirm]: (
      <ConfirmButtonContainer isHidden={!isAdditionalTextVisible}>
        <ScrollContainer isHidden={!isAdditionalTextVisible}>
          <CenteredFlexRow>
            <Typography type="captionRegular">
              <Trans t={t}>Scroll down to check all details</Trans>
            </Typography>
          </CenteredFlexRow>
        </ScrollContainer>
        <Button
          color={isActiveAccountFromLedger ? 'primaryRed' : 'primaryBlue'}
          type="button"
          disabled={
            isSubmitButtonDisable ||
            isValidatorFormButtonDisabled ||
            isAmountFormButtonDisabled
          }
          onClick={
            isActiveAccountFromLedger ? makeSubmitLedgerAction() : submitStake
          }
        >
          {isActiveAccountFromLedger ? (
            <AlignedFlexRow gap={SpacingSize.Small}>
              <SvgIcon src="assets/icons/ledger-white.svg" />
              <Trans t={t}>{confirmButtonText}</Trans>
            </AlignedFlexRow>
          ) : (
            <Trans t={t}>{confirmButtonText}</Trans>
          )}
        </Button>
      </ConfirmButtonContainer>
    ),
    [StakeSteps.ConfirmWithLedger]: ledgerFooterButton ? (
      ledgerFooterButton()
    ) : (
      <></>
    ),
    [StakeSteps.Success]: (
      <FooterButtonsContainer>
        <Button
          color="primaryBlue"
          type="button"
          onClick={() => {
            const currentDate = Date.now();

            const shouldAskForReview =
              askForReviewAfter == null || currentDate > askForReviewAfter;

            if (ratedInStore || !shouldAskForReview) {
              const homeRoutesState = {
                state: {
                  // set the active tab to deploys
                  activeTabId: HomePageTabsId.Deploys
                }
              };

              // Navigate "Home" with the pre-defined state
              navigate(RouterPath.Home, homeRoutesState);
            } else {
              // Navigate to "RateApp" when the application has not been rated in the store,
              // and it's time to ask for a review.
              navigate(RouterPath.RateApp);
            }
          }}
        >
          <Trans t={t}>Done</Trans>
        </Button>
      </FooterButtonsContainer>
    )
  };

  if (
    (stakeType === AuctionManagerEntryPoint.undelegate ||
      stakeType === AuctionManagerEntryPoint.redelegate) &&
    (!accountBalance.delegatedBalance ||
      accountBalance.delegatedBalance === '0')
  ) {
    return (
      <PopupLayout
        renderHeader={() => (
          <HeaderPopup withNetworkSwitcher withMenu withConnectionStatus />
        )}
        renderContent={() => <NoDelegations />}
        renderFooter={() => (
          <FooterButtonsContainer>
            <Button
              color="primaryBlue"
              type="button"
              onClick={() => navigate(RouterPath.Home)}
            >
              <Trans t={t}>Understood</Trans>
            </Button>
          </FooterButtonsContainer>
        )}
      />
    );
  }

  return (
    <PopupLayout
      renderHeader={() => (
        <HeaderPopup
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={
            stakeStep === StakeSteps.Success
              ? undefined
              : () => headerButtons[stakeStep]
          }
        />
      )}
      renderContent={() => content[stakeStep]}
      renderFooter={() => footerButtons[stakeStep]}
    />
  );
};
