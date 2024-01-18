import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import {
  AuctionManagerEntryPoint,
  STAKE_COST_MOTES,
  StakeSteps
} from '@src/constants';

import { StakesPageContent } from '@popup/pages/stakes/content';
import { NoDelegations } from '@popup/pages/stakes/no-delegations';
import { RouterPath, useTypedLocation, useTypedNavigate } from '@popup/router';

import { accountPendingTransactionsChanged } from '@background/redux/account-info/actions';
import { selectAccountBalance } from '@background/redux/account-info/selectors';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';

import { createAsymmetricKey } from '@libs/crypto/create-asymmetric-key';
import {
  CenteredFlexRow,
  ContentContainer,
  ErrorPath,
  FooterButtonsContainer,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  ParagraphContainer,
  PopupLayout,
  SpaceBetweenFlexRow,
  SpacingSize,
  createErrorLocationState
} from '@libs/layout';
import { dispatchFetchExtendedDeploysInfo } from '@libs/services/account-activity-service';
import { makeAuctionManagerDeploy } from '@libs/services/deployer-service';
import {
  dispatchFetchAuctionValidatorsRequest,
  dispatchFetchValidatorsDetailsDataRequest
} from '@libs/services/validators-service';
import { ValidatorResultWithId } from '@libs/services/validators-service/types';
import { Button, HomePageTabsId, Typography } from '@libs/ui/components';
import { calculateSubmitButtonDisabled } from '@libs/ui/forms/get-submit-button-state-from-validation';
import { useStakesForm } from '@libs/ui/forms/stakes-form';
import { CSPRtoMotes, formatNumber, motesToCSPR } from '@libs/ui/utils';

export const StakesPage = () => {
  const [stakeStep, setStakeStep] = useState(StakeSteps.Validator);
  const [validatorPublicKey, setValidatorPublicKey] = useState('');
  const [inputAmountCSPR, setInputAmountCSPR] = useState('');
  const [isSubmitButtonDisable, setIsSubmitButtonDisable] = useState(true);
  const [validator, setValidator] = useState<ValidatorResultWithId | null>(
    null
  );
  const [stakesType, setStakesType] = useState<AuctionManagerEntryPoint>(
    AuctionManagerEntryPoint.delegate
  );
  const [stakeAmountMotes, setStakeAmountMotes] = useState('');
  const [validatorList, setValidatorList] = useState<
    ValidatorResultWithId[] | null
  >(null);
  const [loading, setLoading] = useState(true);

  const activeAccount = useSelector(selectVaultActiveAccount);
  const {
    networkName,
    nodeUrl,
    auctionManagerContractHash,
    casperClarityApiUrl
  } = useSelector(selectApiConfigBasedOnActiveNetwork);
  const csprBalance = useSelector(selectAccountBalance);

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

              setValidatorList(validatorListWithId);
            }
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  }, [activeAccount, pathname, casperClarityApiUrl]);

  const { amountForm, validatorForm } = useStakesForm(
    csprBalance.liquidMotes,
    stakesType,
    stakeAmountMotes,
    validator?.delegators_number
  );
  const { formState: amountFormState, getValues: getValuesAmountForm } =
    amountForm;
  const { formState: validatorFormState, getValues: getValuesValidatorForm } =
    validatorForm;

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

  const submitStake = () => {
    if (activeAccount) {
      const motesAmount = CSPRtoMotes(inputAmountCSPR);

      const KEYS = createAsymmetricKey(
        activeAccount.publicKey,
        activeAccount.secretKey
      );

      const deploy = makeAuctionManagerDeploy(
        stakesType,
        activeAccount.publicKey,
        validatorPublicKey,
        null,
        motesAmount,
        networkName,
        auctionManagerContractHash
      );

      const signDeploy = deploy.sign([KEYS]);

      signDeploy.send(nodeUrl).then((deployHash: string) => {
        if (deployHash) {
          let triesLeft = 10;
          const interval = setInterval(async () => {
            const { payload: extendedDeployInfo } =
              await dispatchFetchExtendedDeploysInfo(deployHash);
            if (extendedDeployInfo) {
              dispatchToMainStore(
                accountPendingTransactionsChanged(extendedDeployInfo)
              );
              clearInterval(interval);
            } else if (triesLeft === 0) {
              clearInterval(interval);
            }

            triesLeft--;
            //   Note: this timeout is needed because the deploy is not immediately visible in the explorer
          }, 2000);

          setStakeStep(StakeSteps.Success);
        } else {
          navigate(
            ErrorPath,
            createErrorLocationState({
              errorHeaderText: t('Something went wrong'),
              errorContentText: t(
                'Please check browser console for error details, this will be a valuable for our team to fix the issue.'
              ),
              errorPrimaryButtonLabel: t('Close'),
              errorRedirectPath: RouterPath.Home
            })
          );
        }
      });
    }
  };

  const getButtonProps = () => {
    const isValidatorFormButtonDisabled = calculateSubmitButtonDisabled({
      isValid: validatorFormState.isValid
    });
    const isAmountFormButtonDisabled = calculateSubmitButtonDisabled({
      isValid: amountFormState.isValid
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
          onClick: submitStake
        };
      }
      case StakeSteps.Success: {
        return {
          onClick: () => {
            navigate(RouterPath.Home, {
              state: {
                // set the active tab to deploys
                activeTabId: HomePageTabsId.Deploys
              }
            });
          }
        };
      }
    }
  };

  const handleBackButton = () => {
    switch (stakeStep) {
      case StakeSteps.Validator: {
        navigate(-1);
        break;
      }
      case StakeSteps.Amount: {
        setStakeStep(StakeSteps.Validator);
        break;
      }
      case StakeSteps.Confirm: {
        setStakeStep(StakeSteps.Amount);
        break;
      }

      default: {
        navigate(-1);
        break;
      }
    }
  };

  const getConfirmButtonText = () => {
    switch (stakesType) {
      case AuctionManagerEntryPoint.delegate: {
        return t('Confirm delegation');
      }
      case AuctionManagerEntryPoint.undelegate: {
        return t('Confirm undelegation');
      }
      default: {
        return t('Confirm');
      }
    }
  };

  if (loading) {
    return (
      <PopupLayout
        renderHeader={() => (
          <HeaderPopup withNetworkSwitcher withMenu withConnectionStatus />
        )}
        renderContent={() => (
          <ContentContainer>
            <ParagraphContainer top={SpacingSize.XL}>
              <CenteredFlexRow>
                <Typography type="body">Loading...</Typography>
              </CenteredFlexRow>
            </ParagraphContainer>
          </ContentContainer>
        )}
      />
    );
  }

  if (
    stakesType === AuctionManagerEntryPoint.undelegate &&
    validatorList !== null &&
    validatorList.length === 0
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
              : () => (
                  <HeaderSubmenuBarNavLink
                    linkType="back"
                    onClick={handleBackButton}
                    backTypeWithBalance
                  />
                )
          }
        />
      )}
      renderContent={() => (
        <StakesPageContent
          stakeStep={stakeStep}
          validatorForm={validatorForm}
          amountForm={amountForm}
          inputAmountCSPR={inputAmountCSPR}
          validator={validator}
          setValidator={setValidator}
          stakesType={stakesType}
          stakeAmountMotes={stakeAmountMotes}
          setStakeAmount={setStakeAmountMotes}
          validatorList={validatorList}
        />
      )}
      renderFooter={() => (
        <FooterButtonsContainer>
          {stakeStep === StakeSteps.Amount ? (
            <SpaceBetweenFlexRow>
              <Typography type="captionRegular">
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
            <Trans t={t}>
              {stakeStep === StakeSteps.Confirm
                ? getConfirmButtonText()
                : stakeStep === StakeSteps.Success
                  ? 'Done'
                  : 'Next'}
            </Trans>
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
};
