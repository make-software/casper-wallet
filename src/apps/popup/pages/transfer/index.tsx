import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';

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
import { useActiveAccountBalance } from '@hooks/use-active-account-balance';
import { CSPRtoMotes, motesToCSPR } from '@libs/ui/utils/formatters';
import { TransactionSteps } from './utils';
import { RouterPath, useTypedNavigate } from '@popup/router';
import { Button, Typography } from '@libs/ui';
import { TRANSFER_COST_MOTES } from '@src/constants';
import { calculateSubmitButtonDisabled } from '@libs/ui/forms/get-submit-button-state-from-validation';
import { dispatchToMainStore } from '@background/redux/utils';
import { recipientPublicKeyAdded } from '@src/background/redux/recent-recipient-public-keys/actions';
import { signAndDeploy } from '@src/libs/services/deployer-service';

export const TransferPage = () => {
  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  const [recipientPublicKey, setRecipientPublicKey] = useState('');
  const [amountInCSPR, setAmountInCSPR] = useState('');
  const [transferIdMemo, setTransferIdMemo] = useState('');
  const [transferStep, setTransferStep] = useState<TransactionSteps>(
    TransactionSteps.Recipient
  );
  const [isSubmitButtonDisable, setIsSubmitButtonDisable] = useState(true);

  const activeAccount = useSelector(selectVaultActiveAccount);
  const { networkName, grpcUrl } = useSelector(
    selectApiConfigBasedOnActiveNetwork
  );

  const { balance } = useActiveAccountBalance();

  const {
    amountForm: {
      register: amountFormRegister,
      formState: amountFormState,
      getValues: getValuesAmountForm
    },
    recipientForm: {
      register: recipientFormRegister,
      formState: recipientFormState,
      getValues: getValuesRecipientForm
    }
  } = useTransferForm(balance.amount);

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
      const motesAmount = CSPRtoMotes(amountInCSPR);

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
      ).then(() => {
        dispatchToMainStore(recipientPublicKeyAdded(recipientPublicKey));
        // TODO: change to token detail page after it will be implemented
        navigate(RouterPath.Home);
      });
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
            const { transferIdMemo, csprAmount } = getValuesAmountForm();

            setAmountInCSPR(csprAmount);
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

  return (
    <PopupLayout
      renderHeader={() => (
        <PopupHeader
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={() => (
            <HeaderSubmenuBarNavLink
              linkType="back"
              onClick={handleBackButton}
            />
          )}
        />
      )}
      renderContent={() => (
        <TransferPageContent
          transferStep={transferStep}
          amountFormRegister={amountFormRegister}
          amountFormState={amountFormState}
          recipientFormState={recipientFormState}
          recipientFormRegister={recipientFormRegister}
          recipientPublicKey={recipientPublicKey}
          amountInCSPR={amountInCSPR}
        />
      )}
      renderFooter={() => (
        <FooterButtonsContainer>
          {transferStep === TransactionSteps.Confirm ? null : (
            <SpaceBetweenFlexRow>
              <Typography type="captionRegular">
                <Trans t={t}>Transaction fee</Trans>
              </Typography>
              <Typography type="captionHash">
                {`${motesToCSPR(TRANSFER_COST_MOTES)} CSPR`}
              </Typography>
            </SpaceBetweenFlexRow>
          )}
          <Button color="primaryBlue" type="button" {...getButtonProps()}>
            <Trans t={t}>
              {transferStep === TransactionSteps.Confirm ? 'Send' : 'Next'}
            </Trans>
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
};
