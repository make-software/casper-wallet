import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';
import { CLPublicKey, DeployUtil } from 'casper-js-sdk';
import { CEP18Client } from 'casper-cep18-js-client';
import { useParams } from 'react-router-dom';
import { sub } from 'date-fns';

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
  formatNumber,
  motesToCSPR,
  multiplyErc20Balance
} from '@libs/ui/utils/formatters';
import { RouterPath, useTypedLocation, useTypedNavigate } from '@popup/router';
import { Button, HomePageTabsId, Typography } from '@libs/ui';
import {
  ERC20_PAYMENT_AMOUNT_AVERAGE_MOTES,
  TRANSFER_COST_MOTES
} from '@src/constants';
import { calculateSubmitButtonDisabled } from '@libs/ui/forms/get-submit-button-state-from-validation';
import { dispatchToMainStore } from '@background/redux/utils';
import { recipientPublicKeyAdded } from '@src/background/redux/recent-recipient-public-keys/actions';
import { signAndDeploy } from '@src/libs/services/deployer-service';
import { useActiveAccountErc20Tokens } from '@src/hooks/use-active-account-erc20-tokens';
import { selectAccountBalance } from '@src/background/redux/account-info/selectors';
import { dispatchFetchExtendedDeploysInfo } from '@src/libs/services/account-activity-service';
import { accountPendingTransactionsChanged } from '@src/background/redux/account-info/actions';
import { createErrorLocationState, ErrorPath } from '@layout/error';
import { selectAllPublicKeys } from '@background/redux/contacts/selectors';

import { getIsErc20Transfer, TransactionSteps } from './utils';

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
    : csprBalance.amountMotes && motesToCSPR(csprBalance.amountMotes);
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
    csprBalance.amountMotes,
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
    csprBalance.amountMotes,
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

  const onSubmitSending = () => {
    if (activeAccount) {
      const publicKeyFromHex = (publicKeyHex: string) => {
        return CLPublicKey.fromHex(publicKeyHex);
      };

      if (isErc20Transfer) {
        // ERC20 transfer
        const cep18 = new CEP18Client(nodeUrl, networkName);

        cep18.setContractHash(
          `hash-${tokenContractHash}`,
          `hash-${tokenContractPackageHash}`
        );

        // create deploy
        const tempDeploy = cep18.transfer(
          {
            recipient: publicKeyFromHex(recipientPublicKey),
            amount: multiplyErc20Balance(amount, erc20Decimals) || '0'
          },
          CSPRtoMotes(paymentAmount),
          publicKeyFromHex(activeAccount.publicKey),
          networkName
        );

        const deployParams = new DeployUtil.DeployParams(
          publicKeyFromHex(activeAccount.publicKey),
          networkName,
          undefined,
          undefined,
          undefined,
          sub(new Date(), { seconds: 2 }).getTime() // https://github.com/casper-network/casper-node/issues/4152
        );

        const deploy = DeployUtil.makeDeploy(
          deployParams,
          tempDeploy.session,
          tempDeploy.payment
        );

        signAndDeploy(
          deploy,
          activeAccount.publicKey,
          activeAccount.secretKey,
          nodeUrl
        ).then(({ deploy_hash }) => {
          dispatchToMainStore(recipientPublicKeyAdded(recipientPublicKey));

          if (deploy_hash != null) {
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
      } else {
        // CSPR transfer
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
          nodeUrl
        ).then(({ deploy_hash }) => {
          dispatchToMainStore(recipientPublicKeyAdded(recipientPublicKey));

          if (deploy_hash != null) {
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
          balance={formattedBalance}
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
