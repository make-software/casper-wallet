import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';
import { CLPublicKey } from 'casper-js-sdk';
import { CEP18Client } from 'casper-cep18-js-client';

import {
  FooterButtonsContainer,
  HeaderSubmenuBarNavLink,
  PopupHeader,
  PopupLayout,
  SpaceBetweenFlexRow
} from '@libs/layout';
import { makeNativeTransferDeploy } from '@libs/services/transfer-service/transfer-service';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { TransferPageContent } from '@popup/pages/transfer/content';
import { useTransferForm } from '@libs/ui/forms/transfer';
import {
  CSPRtoMotes,
  divideErc20Balance,
  motesToCSPR,
  multiplyErc20Balance
} from '@libs/ui/utils/formatters';
import { getIsErc20Transfer, TransactionSteps } from './utils';
import { RouterPath, useTypedNavigate } from '@popup/router';
import { Button, Typography } from '@libs/ui';
import { TRANSFER_COST_MOTES } from '@src/constants';
import { calculateSubmitButtonDisabled } from '@libs/ui/forms/get-submit-button-state-from-validation';
import { dispatchToMainStore } from '@background/redux/utils';
import { recipientPublicKeyAdded } from '@src/background/redux/recent-recipient-public-keys/actions';
import { signAndDeploy } from '@src/libs/services/deployer-service';
import { useParams } from 'react-router-dom';
import { useActiveAccountErc20Tokens } from '@src/hooks/use-active-account-erc20-tokens';
import { selectAccountBalance } from '@src/background/redux/account-info/selectors';
import { dispatchFetchExtendedDeploysInfo } from '@src/libs/services/account-activity-service';
import { accountPendingTransactionsChanged } from '@src/background/redux/account-info/actions';
import { HomePageTabsId } from '../home';
import { ERC20_PAYMENT_AMOUNT_AVERAGE_MOTES } from '@src/libs/ui/utils/constants';

export const TransferPage = () => {
  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  const { tokenContractHash } = useParams();

  const isErc20Transfer = getIsErc20Transfer(tokenContractHash);

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
  const { networkName, grpcUrl } = useSelector(
    selectApiConfigBasedOnActiveNetwork
  );

  const csprBalance = useSelector(selectAccountBalance);
  const { tokens } = useActiveAccountErc20Tokens();
  const token = tokens?.find(token => token.id === tokenContractHash);

  const symbol = isErc20Transfer ? token?.symbol || null : 'CSPR';
  const erc20Decimals = token?.decimals != null ? token.decimals : null;
  const erc20Balance =
    (token?.balance && divideErc20Balance(token?.balance, erc20Decimals)) ||
    null;
  const balance = isErc20Transfer
    ? erc20Balance
    : csprBalance.amountMotes && motesToCSPR(csprBalance.amountMotes);

  const { amountForm, recipientForm } = useTransferForm(
    balance,
    erc20Decimals,
    isErc20Transfer
  );

  const { formState: amountFormState, getValues: getValuesAmountForm } =
    amountForm;
  const { formState: recipientFormState, getValues: getValuesRecipientForm } =
    recipientForm;

  // event listener for enable/disable submit button
  useEffect(() => {
    const layoutContentContainer = document.querySelector(
      '#layout-content-container'
    );

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

  const onSubmitSending = () => {
    if (activeAccount) {
      const publicKeyFromHex = (publicKeyHex: string) => {
        return CLPublicKey.fromHex(publicKeyHex);
      };

      if (isErc20Transfer) {
        const cep18 = new CEP18Client(grpcUrl, networkName);
        cep18.setContractHash(`hash-${tokenContractHash}`);
        // create deploy
        const deploy = cep18.transfer(
          {
            recipient: publicKeyFromHex(recipientPublicKey),
            amount: multiplyErc20Balance(amount, erc20Decimals) || '0'
          },
          paymentAmount,
          publicKeyFromHex(activeAccount.publicKey),
          networkName
        );
        // sign and send deploy
        signAndDeploy(
          deploy,
          activeAccount.publicKey,
          activeAccount.secretKey,
          grpcUrl
        ).then(({ deploy_hash }) => {
          dispatchToMainStore(recipientPublicKeyAdded(recipientPublicKey));

          let triesLeft = 10;
          const interval = setInterval(async () => {
            const { payload: extendedDeployInfo } =
              await dispatchFetchExtendedDeploysInfo(deploy_hash);
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
        });
      } else {
        const motesAmount = CSPRtoMotes(amount);

        const deploy = makeNativeTransferDeploy(
          activeAccount.publicKey,
          recipientPublicKey,
          motesAmount,
          networkName,
          transferIdMemo
        );

        signAndDeploy(
          deploy,
          activeAccount.publicKey,
          activeAccount.secretKey,
          grpcUrl
        ).then(({ deploy_hash }) => {
          dispatchToMainStore(recipientPublicKeyAdded(recipientPublicKey));

          let triesLeft = 10;
          const interval = setInterval(async () => {
            const { payload: extendedDeployInfo } =
              await dispatchFetchExtendedDeploysInfo(deploy_hash);
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
        });
      }
    }
  };

  const getButtonProps = () => {
    switch (transferStep) {
      case TransactionSteps.Recipient: {
        const isButtonDisabled = calculateSubmitButtonDisabled({
          isValid: recipientFormState.isValid
        });

        return {
          disabled: isButtonDisabled,
          onClick: () => {
            const { recipientPublicKey } = getValuesRecipientForm();

            setTransferStep(TransactionSteps.Amount);
            setRecipientPublicKey(recipientPublicKey);
          }
        };
      }
      case TransactionSteps.Amount: {
        const isButtonDisabled = calculateSubmitButtonDisabled({
          isValid: amountFormState.isValid
        });

        return {
          disabled: isButtonDisabled,
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
          disabled: isSubmitButtonDisable,
          onClick: onSubmitSending
        };
      }
      case TransactionSteps.Success: {
        return {
          onClick: () => {
            navigate(RouterPath.Home, {
              state: {
                // set the active tab to activity
                activeTabId: HomePageTabsId.Activity
              }
            });
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
    ? `${motesToCSPR(paymentAmount)} CSPR`
    : `${motesToCSPR(TRANSFER_COST_MOTES)} CSPR`;

  return (
    <PopupLayout
      renderHeader={() => (
        <PopupHeader
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
          balance={balance}
          symbol={symbol}
        />
      )}
      renderFooter={() => (
        <FooterButtonsContainer>
          {transferStep === TransactionSteps.Confirm ||
          transferStep === TransactionSteps.Success ? null : (
            <SpaceBetweenFlexRow>
              <Typography type="captionRegular">
                <Trans t={t}>Transaction fee</Trans>
              </Typography>
              <Typography type="captionHash">{transactionFee}</Typography>
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
        </FooterButtonsContainer>
      )}
    />
  );
};
