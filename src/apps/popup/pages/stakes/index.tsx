import { DeployUtil } from 'casper-js-sdk';
import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import {
  AuctionManagerEntryPoint,
  STAKE_COST_MOTES,
  StakeSteps
} from '@src/constants';
import { fetchAndDispatchExtendedDeployInfo } from '@src/utils';

import { StakesPageContent } from '@popup/pages/stakes/content';
import { NoDelegations } from '@popup/pages/stakes/no-delegations';
import { useConfirmationButtonText } from '@popup/pages/stakes/utils';
import { RouterPath, useTypedLocation, useTypedNavigate } from '@popup/router';

import { selectAccountBalance } from '@background/redux/account-info/selectors';
import { ledgerDeployChanged } from '@background/redux/ledger/actions';
import {
  selectAskForReviewAfter,
  selectRatedInStore
} from '@background/redux/rate-app/selectors';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import {
  selectIsActiveAccountFromLedger,
  selectVaultActiveAccount
} from '@background/redux/vault/selectors';

import { useLedger } from '@hooks/use-ledger';

import { createAsymmetricKey } from '@libs/crypto/create-asymmetric-key';
import {
  AlignedFlexRow,
  ErrorPath,
  FooterButtonsContainer,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  PopupLayout,
  SpaceBetweenFlexRow,
  SpacingSize,
  createErrorLocationState
} from '@libs/layout';
import {
  makeAuctionManagerDeploy,
  sendSignDeploy,
  signDeploy
} from '@libs/services/deployer-service';
import {
  dispatchFetchAuctionValidatorsRequest,
  dispatchFetchValidatorsDetailsDataRequest
} from '@libs/services/validators-service';
import { ValidatorResultWithId } from '@libs/services/validators-service/types';
import {
  Button,
  HomePageTabsId,
  SvgIcon,
  Typography,
  renderLedgerFooter
} from '@libs/ui/components';
import { calculateSubmitButtonDisabled } from '@libs/ui/forms/get-submit-button-state-from-validation';
import { useStakesForm } from '@libs/ui/forms/stakes-form';
import { CSPRtoMotes, formatNumber, motesToCSPR } from '@libs/ui/utils';

export const StakesPage = () => {
  const [stakeStep, setStakeStep] = useState(StakeSteps.Validator);
  const [validatorPublicKey, setValidatorPublicKey] = useState('');
  const [newValidatorPublicKey, setNewValidatorPublicKey] = useState('');
  const [inputAmountCSPR, setInputAmountCSPR] = useState('');
  const [isSubmitButtonDisable, setIsSubmitButtonDisable] = useState(true);
  const [validator, setValidator] = useState<ValidatorResultWithId | null>(
    null
  );
  const [newValidator, setNewValidator] =
    useState<ValidatorResultWithId | null>(null);
  const [stakesType, setStakesType] = useState<AuctionManagerEntryPoint>(
    AuctionManagerEntryPoint.delegate
  );
  const [stakeAmountMotes, setStakeAmountMotes] = useState('');
  const [validatorList, setValidatorList] = useState<
    ValidatorResultWithId[] | null
  >(null);
  const [undelegateValidatorList, setUndelegateValidatorList] = useState<
    ValidatorResultWithId[] | null
  >(null);
  const [loading, setLoading] = useState(true);

  const activeAccount = useSelector(selectVaultActiveAccount);
  const isActiveAccountFromLedger = useSelector(
    selectIsActiveAccountFromLedger
  );
  const {
    networkName,
    nodeUrl,
    auctionManagerContractHash,
    casperClarityApiUrl
  } = useSelector(selectApiConfigBasedOnActiveNetwork);
  const csprBalance = useSelector(selectAccountBalance);
  const ratedInStore = useSelector(selectRatedInStore);
  const askForReviewAfter = useSelector(selectAskForReviewAfter);

  const { t } = useTranslation();
  const navigate = useTypedNavigate();
  const { pathname } = useTypedLocation();

  useEffect(() => {
    // checking pathname to know what type of stake it is
    if (pathname.split('/')[1] === AuctionManagerEntryPoint.delegate) {
      setStakesType(AuctionManagerEntryPoint.delegate);

      dispatchFetchAuctionValidatorsRequest()
        .then(({ payload }) => {
          if ('data' in payload) {
            const { data } = payload;

            const validatorListWithId = data.map(validator => ({
              ...validator,
              id: validator.public_key
            }));

            setValidatorList(validatorListWithId);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (pathname.split('/')[1] === AuctionManagerEntryPoint.undelegate) {
      setStakesType(AuctionManagerEntryPoint.undelegate);

      if (activeAccount) {
        dispatchFetchValidatorsDetailsDataRequest(activeAccount.publicKey)
          .then(({ payload }) => {
            if ('data' in payload) {
              const { data } = payload;

              const validatorListWithId = data.map(delegator => ({
                ...delegator.validator,
                id: delegator.validator_public_key,
                user_stake: delegator.stake
              }));

              setUndelegateValidatorList(validatorListWithId);
            }
          })
          .finally(() => {
            setLoading(false);
          });
      }
    } else if (pathname.split('/')[1] === AuctionManagerEntryPoint.redelegate) {
      setStakesType(AuctionManagerEntryPoint.redelegate);

      if (activeAccount) {
        Promise.all([
          dispatchFetchAuctionValidatorsRequest(),
          dispatchFetchValidatorsDetailsDataRequest(activeAccount.publicKey)
        ])
          .then(([allValidatorsResp, undelegateValidatorResp]) => {
            if ('data' in allValidatorsResp.payload) {
              const { data } = allValidatorsResp.payload;

              const validatorListWithId = data.map(validator => ({
                ...validator,
                id: validator.public_key
              }));

              setValidatorList(validatorListWithId);
            }
            if ('data' in undelegateValidatorResp.payload) {
              const { data } = undelegateValidatorResp.payload;

              const validatorListWithId = data.map(delegator => ({
                ...delegator.validator,
                id: delegator.validator_public_key,
                user_stake: delegator.stake
              }));

              setUndelegateValidatorList(validatorListWithId);
            }
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  }, [activeAccount, pathname, casperClarityApiUrl]);

  const { amountForm, validatorForm, newValidatorForm } = useStakesForm(
    csprBalance.liquidMotes,
    stakesType,
    stakeAmountMotes,
    validator?.delegators_number,
    newValidator?.delegators_number
  );
  const { formState: amountFormState, getValues: getValuesAmountForm } =
    amountForm;
  const { formState: validatorFormState, getValues: getValuesValidatorForm } =
    validatorForm;
  const {
    formState: newValidatorFormState,
    getValues: getValuesNewValidatorForm
  } = newValidatorForm;

  // event listener for enable/disable submit button
  useEffect(() => {
    if (stakeStep !== StakeSteps.Confirm) return;

    const layoutContentContainer = document.querySelector('#ms-container');

    // if the content is not scrollable, we can enable the submit button
    if (
      layoutContentContainer &&
      layoutContentContainer.clientHeight ===
        layoutContentContainer.scrollHeight &&
      isSubmitButtonDisable
    ) {
      setIsSubmitButtonDisable(false);
    }

    const handleScroll = () => {
      if (layoutContentContainer && isSubmitButtonDisable) {
        const bottom =
          Math.ceil(
            layoutContentContainer.clientHeight +
              layoutContentContainer.scrollTop
          ) >= layoutContentContainer.scrollHeight;

        if (bottom) {
          setIsSubmitButtonDisable(false);
        }
      }
    };

    // add event listener to the scrollable container
    layoutContentContainer?.addEventListener('scroll', handleScroll);

    // remove event listener on cleanup
    return () => {
      layoutContentContainer?.removeEventListener('scroll', handleScroll);
    };
  }, [isSubmitButtonDisable, stakeStep]);

  const submitStake = async () => {
    if (activeAccount) {
      const motesAmount = CSPRtoMotes(inputAmountCSPR);

      const KEYS = createAsymmetricKey(
        activeAccount.publicKey,
        activeAccount.secretKey
      );

      const deploy = await makeAuctionManagerDeploy(
        stakesType,
        activeAccount.publicKey,
        validatorPublicKey,
        newValidatorPublicKey || null,
        motesAmount,
        networkName,
        auctionManagerContractHash,
        nodeUrl
      );

      const signedDeploy = await signDeploy(deploy, [KEYS], activeAccount);

      sendSignDeploy(signedDeploy, nodeUrl)
        .then(resp => {
          if ('result' in resp) {
            fetchAndDispatchExtendedDeployInfo(resp.result.deploy_hash);

            setStakeStep(StakeSteps.Success);
          } else {
            navigate(
              ErrorPath,
              createErrorLocationState({
                errorHeaderText:
                  resp.error.message || t('Something went wrong'),
                errorContentText:
                  resp.error.data ||
                  t(
                    'Please check browser console for error details, this will be a valuable for our team to fix the issue.'
                  ),
                errorPrimaryButtonLabel: t('Close'),
                errorRedirectPath: RouterPath.Home
              })
            );
          }
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

      const deploy = await makeAuctionManagerDeploy(
        stakesType,
        activeAccount.publicKey,
        validatorPublicKey,
        newValidatorPublicKey || null,
        motesAmount,
        networkName,
        auctionManagerContractHash,
        nodeUrl
      );

      dispatchToMainStore(
        ledgerDeployChanged(JSON.stringify(DeployUtil.deployToJson(deploy)))
      );
    }
  };

  const { ledgerEventStatusToRender, makeSubmitLedgerAction } = useLedger({
    ledgerAction: submitStake,
    beforeLedgerActionCb
  });

  const getButtonProps = () => {
    const isValidatorFormButtonDisabled = calculateSubmitButtonDisabled({
      isValid: validatorFormState.isValid
    });
    const isAmountFormButtonDisabled = calculateSubmitButtonDisabled({
      isValid: amountFormState.isValid
    });
    const isNewValidatorFormButtonDisabled = calculateSubmitButtonDisabled({
      isValid: newValidatorFormState.isValid
    });

    switch (stakeStep) {
      case StakeSteps.Validator: {
        return {
          disabled: isValidatorFormButtonDisabled,
          onClick: () => {
            const { validatorPublicKey } = getValuesValidatorForm();

            setStakeStep(StakeSteps.Amount);
            setValidatorPublicKey(validatorPublicKey);
          }
        };
      }
      case StakeSteps.Amount: {
        return {
          disabled: isAmountFormButtonDisabled,
          onClick: () => {
            const { amount: _amount } = getValuesAmountForm();

            setInputAmountCSPR(_amount);
            if (stakesType === AuctionManagerEntryPoint.redelegate) {
              setStakeStep(StakeSteps.NewValidator);
            } else {
              setStakeStep(StakeSteps.Confirm);
            }
          }
        };
      }
      case StakeSteps.NewValidator: {
        return {
          disabled: isNewValidatorFormButtonDisabled,
          onClick: () => {
            const { newValidatorPublicKey: _newValidatorPublicKey } =
              getValuesNewValidatorForm();

            setNewValidatorPublicKey(_newValidatorPublicKey);
            setStakeStep(StakeSteps.Confirm);
          }
        };
      }
      case StakeSteps.Confirm: {
        return {
          disabled:
            isSubmitButtonDisable ||
            isValidatorFormButtonDisabled ||
            isAmountFormButtonDisabled,
          onClick: isActiveAccountFromLedger
            ? makeSubmitLedgerAction()
            : submitStake
        };
      }
      case StakeSteps.Success: {
        return {
          onClick: () => {
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
          }
        };
      }
    }
  };

  const getBackButton = {
    [StakeSteps.Validator]: () => (
      <HeaderSubmenuBarNavLink
        linkType="back"
        backTypeWithBalance
        onClick={() => navigate(-1)}
      />
    ),
    [StakeSteps.Amount]: () => (
      <HeaderSubmenuBarNavLink
        linkType="back"
        backTypeWithBalance
        onClick={() => setStakeStep(StakeSteps.Validator)}
      />
    ),
    [StakeSteps.NewValidator]: () => (
      <HeaderSubmenuBarNavLink
        linkType="back"
        backTypeWithBalance
        onClick={() => setStakeStep(StakeSteps.Amount)}
      />
    ),
    [StakeSteps.Confirm]: () => (
      <HeaderSubmenuBarNavLink
        linkType="back"
        backTypeWithBalance
        onClick={() =>
          stakesType === AuctionManagerEntryPoint.redelegate
            ? setStakeStep(StakeSteps.NewValidator)
            : setStakeStep(StakeSteps.Amount)
        }
      />
    ),
    [StakeSteps.ConfirmWithLedger]: () => (
      <HeaderSubmenuBarNavLink
        linkType="back"
        onClick={() => setStakeStep(StakeSteps.Confirm)}
      />
    ),
    [StakeSteps.Success]: undefined
  };

  const confirmButtonText = useConfirmationButtonText(stakesType);

  if (
    (stakesType === AuctionManagerEntryPoint.undelegate ||
      stakesType === AuctionManagerEntryPoint.redelegate) &&
    (csprBalance.delegatedMotes == null || csprBalance.delegatedMotes === '0')
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

  const renderFooter = () => {
    if (stakeStep === StakeSteps.ConfirmWithLedger) {
      return renderLedgerFooter({
        onConnect: makeSubmitLedgerAction,
        event: ledgerEventStatusToRender,
        onErrorCtaPressed: () => setStakeStep(StakeSteps.Confirm)
      });
    }

    return () => (
      <FooterButtonsContainer>
        {stakeStep === StakeSteps.Amount ? (
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
        ) : null}
        <Button color="primaryBlue" type="button" {...getButtonProps()}>
          {isActiveAccountFromLedger && stakeStep === StakeSteps.Confirm ? (
            <AlignedFlexRow gap={SpacingSize.Small}>
              <SvgIcon src="assets/icons/ledger-white.svg" />
              <Trans t={t}>{confirmButtonText}</Trans>
            </AlignedFlexRow>
          ) : (
            <Trans t={t}>
              {stakeStep === StakeSteps.Confirm
                ? confirmButtonText
                : stakeStep === StakeSteps.Success
                  ? 'Done'
                  : 'Next'}
            </Trans>
          )}
        </Button>
      </FooterButtonsContainer>
    );
  };

  return (
    <PopupLayout
      renderHeader={() => (
        <HeaderPopup
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={getBackButton[stakeStep]}
        />
      )}
      renderContent={() => (
        <StakesPageContent
          stakeStep={stakeStep}
          validatorForm={validatorForm}
          amountForm={amountForm}
          newValidatorForm={newValidatorForm}
          inputAmountCSPR={inputAmountCSPR}
          validator={validator}
          setValidator={setValidator}
          newValidator={newValidator}
          setNewValidator={setNewValidator}
          stakesType={stakesType}
          stakeAmountMotes={stakeAmountMotes}
          setStakeAmount={setStakeAmountMotes}
          validatorList={validatorList}
          undelegateValidatorList={undelegateValidatorList}
          loading={loading}
          LedgerEventStatus={ledgerEventStatusToRender}
        />
      )}
      renderFooter={renderFooter()}
    />
  );
};
