import { DeployUtil } from 'casper-js-sdk';
import React, { useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import {
  ERC20_PAYMENT_AMOUNT_AVERAGE_MOTES,
  TRANSFER_COST_MOTES
} from '@src/constants';
import { useActiveAccountErc20Tokens } from '@src/hooks/use-active-account-erc20-tokens';

import { TransferPageContent } from '@popup/pages/transfer/content';
import { RouterPath, useTypedLocation, useTypedNavigate } from '@popup/router';

import { accountPendingTransactionsChanged } from '@background/redux/account-info/actions';
import { selectAccountBalance } from '@background/redux/account-info/selectors';
import { selectAllPublicKeys } from '@background/redux/contacts/selectors';
import {
  selectAskForReviewAfter,
  selectRatedInStore
} from '@background/redux/rate-app/selectors';
import { recipientPublicKeyAdded } from '@background/redux/recent-recipient-public-keys/actions';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';

import { createAsymmetricKey } from '@libs/crypto/create-asymmetric-key';
import {
  ErrorPath,
  FooterButtonsContainer,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  PopupLayout,
  SpaceBetweenFlexRow,
  createErrorLocationState
} from '@libs/layout';
import { dispatchFetchExtendedDeploysInfo } from '@libs/services/account-activity-service';
import {
  makeCep18TransferDeployAndSign,
  makeNativeTransferDeployAndSign,
  sendSignDeploy
} from '@libs/services/deployer-service';
import { Button, HomePageTabsId, Typography } from '@libs/ui/components';
import { calculateSubmitButtonDisabled } from '@libs/ui/forms/get-submit-button-state-from-validation';
import { useTransferForm } from '@libs/ui/forms/transfer';
import {
  CSPRtoMotes,
  divideErc20Balance,
  formatNumber,
  motesToCSPR
} from '@libs/ui/utils';

import { TransactionSteps, getIsErc20Transfer } from './utils';

export const TransferPage = () => {
  const { t } = useTranslation();
  const navigate = useTypedNavigate();
  const location = useTypedLocation();

  const { tokenContractPackageHash, tokenContractHash } = useParams();

  const isErc20Transfer = getIsErc20Transfer(tokenContractPackageHash);

  const [recipientPublicKey, setRecipientPublicKey] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(
    motesToCSPR(ERC20_PAYMENT_AMOUNT_AVERAGE_MOTES)
  );
  const [transferIdMemo, setTransferIdMemo] = useState('');
  const [transferStep, setTransferStep] = useState<TransactionSteps>(
    TransactionSteps.Recipient
  );
  const [isSubmitButtonDisable, setIsSubmitButtonDisable] = useState(true);

  const activeAccount = useSelector(selectVaultActiveAccount);
  const { networkName, nodeUrl } = useSelector(
    selectApiConfigBasedOnActiveNetwork
  );
  const csprBalance = useSelector(selectAccountBalance);
  const contactPublicKeys = useSelector(selectAllPublicKeys);
  const ratedInStore = useSelector(selectRatedInStore);
  const askForReviewAfter = useSelector(selectAskForReviewAfter);

  const { tokens } = useActiveAccountErc20Tokens();

  const token = tokens?.find(token => token.id === tokenContractPackageHash);
  const symbol = isErc20Transfer
    ? token?.symbol || location.state?.tokenData?.symbol || null
    : 'CSPR';
  const erc20Decimals =
    token?.decimals || location.state?.tokenData?.decimals || null;
  const erc20Balance =
    (token?.balance && divideErc20Balance(token?.balance, erc20Decimals)) ||
    null;
  const balance = isErc20Transfer
    ? erc20Balance
    : csprBalance.liquidMotes && motesToCSPR(csprBalance.liquidMotes);
  const formattedBalance = formatNumber(balance || '', {
    precision: { max: 5 }
  });
  const isRecipientPublicKeyInContact = useMemo(
    () => contactPublicKeys.includes(recipientPublicKey),
    [contactPublicKeys, recipientPublicKey]
  );

  const { amountForm, recipientForm } = useTransferForm(
    erc20Balance,
    isErc20Transfer,
    csprBalance.liquidMotes,
    paymentAmount
  );

  const {
    formState: amountFormState,
    getValues: getValuesAmountForm,
    trigger
  } = amountForm;
  const { formState: recipientFormState, getValues: getValuesRecipientForm } =
    recipientForm;

  useEffect(() => {
    if (amountFormState.touchedFields.amount) {
      trigger();
    }
  }, [
    networkName,
    activeAccount?.publicKey,
    trigger,
    amountFormState.touchedFields.amount,
    erc20Balance,
    csprBalance.liquidMotes,
    paymentAmount
  ]);

  // event listener for enable/disable submit button
  useEffect(() => {
    const layoutContentContainer = document.querySelector('#ms-container');

    // if the content is not scrollable, we can enable the submit button
    if (
      layoutContentContainer &&
      layoutContentContainer.clientHeight ===
        layoutContentContainer.scrollHeight &&
      transferStep === TransactionSteps.Confirm &&
      isSubmitButtonDisable
    ) {
      setIsSubmitButtonDisable(false);
    }

    const handleScroll = () => {
      if (
        layoutContentContainer &&
        transferStep === TransactionSteps.Confirm &&
        isSubmitButtonDisable
      ) {
        const bottom =
          Math.ceil(
            layoutContentContainer.clientHeight +
              layoutContentContainer.scrollTop
          ) >= layoutContentContainer.scrollHeight;

        if (bottom) {
          // we are at the bottom of the page
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
  }, [isSubmitButtonDisable, transferStep]);

  const sendDeploy = (signDeploy: DeployUtil.Deploy) => {
    sendSignDeploy(signDeploy, nodeUrl)
      .then(({ result: { deploy_hash: deployHash } }) => {
        dispatchToMainStore(recipientPublicKeyAdded(recipientPublicKey));

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

          setTransferStep(TransactionSteps.Success);
        }
      })
      .catch(error => {
        console.error(error, 'transfer request error');

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
  };

  const onSubmitSending = async () => {
    if (activeAccount) {
      const KEYS = createAsymmetricKey(
        activeAccount.publicKey,
        activeAccount.secretKey
      );
      if (isErc20Transfer) {
        // ERC20 transfer
        const signDeploy = await makeCep18TransferDeployAndSign(
          nodeUrl,
          networkName,
          tokenContractHash,
          tokenContractPackageHash,
          recipientPublicKey,
          amount,
          erc20Decimals,
          paymentAmount,
          activeAccount,
          [KEYS]
        );

        sendDeploy(signDeploy);
      } else {
        // CSPR transfer
        const motesAmount = CSPRtoMotes(amount);

        const signDeploy = await makeNativeTransferDeployAndSign(
          activeAccount.publicKey,
          recipientPublicKey,
          motesAmount,
          networkName,
          nodeUrl,
          [KEYS],
          transferIdMemo
        );

        sendDeploy(signDeploy);
      }
    }
  };

  const getButtonProps = () => {
    const isRecipientFormButtonDisabled = calculateSubmitButtonDisabled({
      isValid: recipientFormState.isValid
    });
    const isAmountFormButtonDisabled = calculateSubmitButtonDisabled({
      isValid: amountFormState.isValid
    });

    switch (transferStep) {
      case TransactionSteps.Recipient: {
        return {
          disabled: isRecipientFormButtonDisabled,
          onClick: () => {
            const { recipientPublicKey } = getValuesRecipientForm();

            setTransferStep(TransactionSteps.Amount);
            setRecipientPublicKey(recipientPublicKey);
          }
        };
      }
      case TransactionSteps.Amount: {
        return {
          disabled: isAmountFormButtonDisabled,
          onClick: () => {
            const {
              transferIdMemo,
              amount: _amount,
              paymentAmount: _paymentAmount
            } = getValuesAmountForm();

            setAmount(_amount);
            setPaymentAmount(_paymentAmount);
            setTransferIdMemo(transferIdMemo);
            setTransferStep(TransactionSteps.Confirm);
          }
        };
      }
      case TransactionSteps.Confirm: {
        return {
          disabled:
            isSubmitButtonDisable ||
            isRecipientFormButtonDisabled ||
            isAmountFormButtonDisabled,
          onClick: onSubmitSending
        };
      }
      case TransactionSteps.Success: {
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

              // Navigate to "Home" with the pre-defined state
              navigate(RouterPath.Home, homeRoutesState);
            } else {
              // Navigate to "RateApp" when the application has not been rated in the store, and it's time to ask for a review.
              navigate(RouterPath.RateApp);
            }
          }
        };
      }
    }
  };

  const handleBackButton = () => {
    switch (transferStep) {
      case TransactionSteps.Recipient: {
        navigate(-1);
        break;
      }
      case TransactionSteps.Amount: {
        setTransferStep(TransactionSteps.Recipient);
        break;
      }
      case TransactionSteps.Confirm: {
        setTransferStep(TransactionSteps.Amount);
        break;
      }

      default: {
        navigate(-1);
        break;
      }
    }
  };

  const transactionFee = isErc20Transfer
    ? `${paymentAmount}`
    : `${motesToCSPR(TRANSFER_COST_MOTES)}`;

  return (
    <PopupLayout
      renderHeader={() => (
        <HeaderPopup
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={
            transferStep === TransactionSteps.Success
              ? undefined
              : () => (
                  <HeaderSubmenuBarNavLink
                    linkType="back"
                    onClick={handleBackButton}
                  />
                )
          }
        />
      )}
      renderContent={() => (
        <TransferPageContent
          transferStep={transferStep}
          recipientForm={recipientForm}
          amountForm={amountForm}
          recipientPublicKey={recipientPublicKey}
          amount={amount}
          paymentAmount={paymentAmount}
          balance={formattedBalance}
          symbol={symbol}
        />
      )}
      renderFooter={() => (
        <FooterButtonsContainer>
          {transferStep === TransactionSteps.Confirm ||
          transferStep === TransactionSteps.Success ? null : (
            <SpaceBetweenFlexRow>
              <Typography type="captionRegular" color="contentSecondary">
                <Trans t={t}>Transaction fee</Trans>
              </Typography>
              <Typography type="captionHash">
                {formatNumber(transactionFee, {
                  precision: { max: 5 }
                })}{' '}
                CSPR
              </Typography>
            </SpaceBetweenFlexRow>
          )}
          <Button color="primaryBlue" type="button" {...getButtonProps()}>
            <Trans t={t}>
              {transferStep === TransactionSteps.Confirm
                ? 'Send'
                : transferStep === TransactionSteps.Success
                  ? 'Done'
                  : 'Next'}
            </Trans>
          </Button>
          {transferStep === TransactionSteps.Success &&
            !isRecipientPublicKeyInContact && (
              <Button
                color="secondaryBlue"
                onClick={() =>
                  navigate(RouterPath.AddContact, {
                    state: {
                      recipientPublicKey: recipientPublicKey
                    }
                  })
                }
              >
                <Trans t={t}>Add recipient to list of contacts</Trans>
              </Button>
            )}
        </FooterButtonsContainer>
      )}
    />
  );
};
