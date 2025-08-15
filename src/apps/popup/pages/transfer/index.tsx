import { Deploy, Transaction } from 'casper-js-sdk';
import React, { useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import {
  ERC20_PAYMENT_AMOUNT_AVERAGE_MOTES,
  ErrorMessages,
  networkNameToSdkNetworkNameMap
} from '@src/constants';

import { useAccountManager } from '@popup/hooks/use-account-actions-with-events';
import { RouterPath, useTypedLocation, useTypedNavigate } from '@popup/router';

import { accountPendingDeployHashesChanged } from '@background/redux/account-info/actions';
import { selectAllContactsPublicKeys } from '@background/redux/contacts/selectors';
import {
  ledgerDeployChanged,
  ledgerRecipientToSaveOnSuccessChanged,
  ledgerTransactionChanged
} from '@background/redux/ledger/actions';
import {
  selectAskForReviewAfter,
  selectRatedInStore
} from '@background/redux/rate-app/selectors';
import { recipientPublicKeyAdded } from '@background/redux/recent-recipient-public-keys/actions';
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

import { TokenType, useCasperToken } from '@hooks/use-casper-token';
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
  PopupLayout,
  SpacingSize,
  VerticalSpaceContainer,
  createErrorLocationState
} from '@libs/layout';
import {
  getDateForDeploy,
  sendSignedTx,
  signTx
} from '@libs/services/deployer-service';
import {
  buildCep18Transactions,
  buildCsprTransferTransactions
} from '@libs/services/tx-builders';
import { HardwareWalletType } from '@libs/types/account';
import {
  Button,
  HomePageTabsId,
  LedgerEventView,
  SvgIcon,
  TransferSuccessScreen,
  Typography,
  renderLedgerFooter
} from '@libs/ui/components';
import { CSPRtoMotes, motesToCSPR, multiplyErc20Balance } from '@libs/ui/utils';

import { AmountStep } from './amount-step';
import { ConfirmStep } from './confirm-step';
import { RecipientStep } from './recipient-step';
import { TokenStep } from './token-step';
import { TransactionSteps } from './utils';

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

export const TransferPage = () => {
  const { t } = useTranslation();
  const navigate = useTypedNavigate();
  const location = useTypedLocation();
  const isCasper2Network = useSelector(selectIsCasper2Network);
  const casperNetworkApiVersion = useSelector(selectCasperNetworkApiVersion);
  const { changeActiveAccountSupportsWithEvent } = useAccountManager();

  const [isErc20Transfer, setIsErc20Transfer] = useState<boolean>(false);
  const [selectedToken, setSelectedToken] = useState<TokenType | null>();
  const [recipientName, setRecipientName] = useState('');
  const [recipientPublicKey, setRecipientPublicKey] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(
    motesToCSPR(ERC20_PAYMENT_AMOUNT_AVERAGE_MOTES)
  );
  const [transferIdMemo, setTransferIdMemo] = useState('');
  const [transferStep, setTransferStep] = useState<TransactionSteps>(
    TransactionSteps.Token
  );
  const [isRecipientFormButtonDisabled, setIsRecipientFormButtonDisabled] =
    useState(true);
  const [isAmountFormButtonDisabled, setIsAmountFormButtonDisabled] =
    useState(false);

  const activeAccount = useSelector(selectVaultActiveAccount);
  const isActiveAccountFromLedger = useSelector(
    selectIsActiveAccountFromLedger
  );
  const { networkName, nodeUrl } = useSelector(
    selectApiConfigBasedOnActiveNetwork
  );
  const contactPublicKeys = useSelector(selectAllContactsPublicKeys);
  const ratedInStore = useSelector(selectRatedInStore);
  const askForReviewAfter = useSelector(selectAskForReviewAfter);

  const casperToken = useCasperToken();

  useEffect(() => {
    const tokenData = location?.state?.tokenData;

    if (selectedToken) {
      return;
    }

    if (tokenData) {
      if (tokenData.name === 'Casper') {
        setIsErc20Transfer(false);
      } else {
        setIsErc20Transfer(true);
      }
      setSelectedToken(tokenData);
    } else {
      setIsErc20Transfer(false);
      setSelectedToken(casperToken);
    }
  }, [casperToken, location?.state?.tokenData, selectedToken]);

  useEffect(() => {
    if (isErc20Transfer) {
      setIsAmountFormButtonDisabled(false);
    } else {
      setIsAmountFormButtonDisabled(true);
    }
  }, [isErc20Transfer, setIsAmountFormButtonDisabled]);

  const isRecipientPublicKeyInContact = useMemo(
    () => contactPublicKeys.includes(recipientPublicKey),
    [contactPublicKeys, recipientPublicKey]
  );

  const {
    isSubmitButtonDisable,
    setIsSubmitButtonDisable,
    isAdditionalTextVisible
  } = useSubmitButton(transferStep === TransactionSteps.Confirm);

  const sendTx = (tx: Transaction) => {
    sendSignedTx(tx, nodeUrl, isCasper2Network)
      .then(hash => {
        dispatchToMainStore(recipientPublicKeyAdded(recipientPublicKey));
        console.log('-------- hash', hash);
        dispatchToMainStore(accountPendingDeployHashesChanged(hash));
        setTransferStep(TransactionSteps.Success);
      })
      .catch(error => {
        console.error(error, 'transfer request error');

        navigate(
          ErrorPath,
          createErrorLocationState({
            errorHeaderText:
              error.sourceErr?.message ||
              error.message ||
              t(ErrorMessages.common.UNKNOWN_ERROR.message),
            errorContentText:
              typeof error?.sourceErr?.data === 'string'
                ? error.sourceErr.data
                : t(ErrorMessages.common.UNKNOWN_ERROR.description),
            errorPrimaryButtonLabel: t('Close'),
            errorRedirectPath: RouterPath.Home
          })
        );
      });
  };

  const onSubmitSending = async () => {
    setIsSubmitButtonDisable(true);

    if (!activeAccount) {
      return;
    }

    const KEYS = createAsymmetricKeys(
      activeAccount.publicKey,
      activeAccount.secretKey
    );

    const timestamp = await getDateForDeploy(nodeUrl);

    if (isErc20Transfer && selectedToken?.contractPackageHash) {
      const { transaction, fallbackDeploy } = buildCep18Transactions(
        {
          chainName: networkNameToSdkNetworkNameMap[networkName],
          contractPackageHash: selectedToken.contractPackageHash,
          paymentAmount: CSPRtoMotes(paymentAmount),
          recipientPublicKeyHex: recipientPublicKey,
          senderPublicKeyHex: activeAccount.publicKey,
          transferAmount:
            multiplyErc20Balance(amount, selectedToken?.decimals ?? 0) ?? '0',
          timestamp
        },
        casperNetworkApiVersion
      );

      const signedTx = await signTx(
        transaction,
        KEYS,
        activeAccount,
        fallbackDeploy,
        changeActiveAccountSupportsWithEvent
      );

      sendTx(signedTx);
    } else {
      const { transaction, fallbackDeploy } = buildCsprTransferTransactions(
        {
          chainName: networkNameToSdkNetworkNameMap[networkName],
          memo: transferIdMemo,
          recipientPublicKeyHex: recipientPublicKey,
          senderPublicKeyHex: activeAccount.publicKey,
          transferAmount: CSPRtoMotes(amount),
          timestamp
        },
        casperNetworkApiVersion
      );

      const signedTx = await signTx(
        transaction,
        KEYS,
        activeAccount,
        fallbackDeploy,
        changeActiveAccountSupportsWithEvent
      );

      sendTx(signedTx);
    }
  };

  const beforeLedgerActionCb = async () => {
    setTransferStep(TransactionSteps.ConfirmWithLedger);

    const timestamp = await getDateForDeploy(nodeUrl);

    if (activeAccount?.hardware === HardwareWalletType.Ledger) {
      if (isErc20Transfer && selectedToken?.contractPackageHash) {
        const { transaction, fallbackDeploy } = buildCep18Transactions(
          {
            chainName: networkNameToSdkNetworkNameMap[networkName],
            contractPackageHash: selectedToken.contractPackageHash,
            paymentAmount: CSPRtoMotes(paymentAmount),
            recipientPublicKeyHex: recipientPublicKey,
            senderPublicKeyHex: activeAccount.publicKey,
            transferAmount:
              multiplyErc20Balance(amount, selectedToken?.decimals ?? 0) ?? '0',
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
        dispatchToMainStore(
          ledgerRecipientToSaveOnSuccessChanged(recipientPublicKey)
        );
      } else {
        const motesAmount = CSPRtoMotes(amount);

        const { transaction, fallbackDeploy } = buildCsprTransferTransactions(
          {
            chainName: networkNameToSdkNetworkNameMap[networkName],
            memo: transferIdMemo,
            recipientPublicKeyHex: recipientPublicKey,
            senderPublicKeyHex: activeAccount.publicKey,
            transferAmount: motesAmount,
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
        dispatchToMainStore(
          ledgerRecipientToSaveOnSuccessChanged(recipientPublicKey)
        );
      }
    }
  };

  const { ledgerEventStatusToRender, makeSubmitLedgerAction } = useLedger({
    ledgerAction: onSubmitSending,
    beforeLedgerActionCb
  });

  const content = {
    [TransactionSteps.Token]: (
      <TokenStep
        setSelectedToken={setSelectedToken}
        setIsErc20Transfer={setIsErc20Transfer}
        selectedToken={selectedToken}
      />
    ),
    [TransactionSteps.Recipient]: (
      <RecipientStep
        setRecipientName={setRecipientName}
        recipientName={recipientName}
        setRecipientPublicKey={setRecipientPublicKey}
        setIsRecipientFormButtonDisabled={setIsRecipientFormButtonDisabled}
      />
    ),
    [TransactionSteps.Amount]: (
      <AmountStep
        isErc20Transfer={isErc20Transfer}
        paymentAmount={paymentAmount}
        selectedToken={selectedToken}
        setAmount={setAmount}
        setPaymentAmount={setPaymentAmount}
        setTransferIdMemo={setTransferIdMemo}
        setIsAmountFormButtonDisabled={setIsAmountFormButtonDisabled}
      />
    ),
    [TransactionSteps.ConfirmWithLedger]: (
      <LedgerEventView event={ledgerEventStatusToRender} />
    ),
    [TransactionSteps.Confirm]: (
      <ConfirmStep
        recipientPublicKey={recipientPublicKey}
        amount={amount}
        balance={selectedToken?.amount}
        symbol={selectedToken?.symbol || null}
        tokenPrice={selectedToken?.tokenPrice}
        isErc20Transfer={isErc20Transfer}
        paymentAmount={paymentAmount}
        recipientName={recipientName}
      />
    ),
    [TransactionSteps.Success]: (
      <TransferSuccessScreen headerText="You submitted a transaction" />
    )
  };

  const headerButtons = {
    [TransactionSteps.Token]: (
      <HeaderSubmenuBarNavLink linkType="back" backTypeWithBalance />
    ),
    [TransactionSteps.Recipient]: (
      <HeaderSubmenuBarNavLink
        linkType="back"
        backTypeWithBalance
        onClick={() => setTransferStep(TransactionSteps.Token)}
      />
    ),
    [TransactionSteps.Amount]: (
      <HeaderSubmenuBarNavLink
        linkType="back"
        backTypeWithBalance
        onClick={() => setTransferStep(TransactionSteps.Recipient)}
      />
    ),
    [TransactionSteps.Confirm]: (
      <HeaderSubmenuBarNavLink
        linkType="back"
        onClick={() => setTransferStep(TransactionSteps.Amount)}
      />
    ),
    [TransactionSteps.ConfirmWithLedger]: (
      <HeaderSubmenuBarNavLink
        linkType="back"
        onClick={() => setTransferStep(TransactionSteps.Confirm)}
      />
    )
  };

  const ledgerFooterButton = renderLedgerFooter({
    onConnect: makeSubmitLedgerAction,
    event: ledgerEventStatusToRender,
    onErrorCtaPressed: () => {
      setTransferStep(TransactionSteps.Confirm);
    }
  });

  const footerButtons = {
    [TransactionSteps.Token]: (
      <FooterButtonsContainer>
        <Button
          color="primaryBlue"
          type="button"
          onClick={() => {
            setTransferStep(TransactionSteps.Recipient);
          }}
        >
          <Trans t={t}>Next</Trans>
        </Button>
      </FooterButtonsContainer>
    ),
    [TransactionSteps.Recipient]: (
      <FooterButtonsContainer>
        <Button
          color="primaryBlue"
          type="button"
          disabled={isRecipientFormButtonDisabled}
          onClick={() => {
            setTransferStep(TransactionSteps.Amount);
          }}
        >
          <Trans t={t}>Next</Trans>
        </Button>
      </FooterButtonsContainer>
    ),
    [TransactionSteps.Amount]: (
      <FooterButtonsContainer>
        <Button
          color={isActiveAccountFromLedger ? 'primaryRed' : 'primaryBlue'}
          type="button"
          disabled={isAmountFormButtonDisabled}
          onClick={() => {
            setTransferStep(TransactionSteps.Confirm);
          }}
        >
          <Trans t={t}>Next</Trans>
        </Button>
      </FooterButtonsContainer>
    ),
    [TransactionSteps.ConfirmWithLedger]: ledgerFooterButton ? (
      ledgerFooterButton()
    ) : (
      <></>
    ),
    [TransactionSteps.Confirm]: (
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
          disabled={
            isSubmitButtonDisable ||
            isRecipientFormButtonDisabled ||
            isAmountFormButtonDisabled
          }
          onClick={
            isActiveAccountFromLedger
              ? makeSubmitLedgerAction()
              : onSubmitSending
          }
        >
          {isActiveAccountFromLedger ? (
            <AlignedFlexRow gap={SpacingSize.Small}>
              <SvgIcon src="assets/icons/ledger-white.svg" />
              <Trans t={t}>Confirm send</Trans>
            </AlignedFlexRow>
          ) : (
            <Trans t={t}>Confirm send</Trans>
          )}
        </Button>
      </ConfirmButtonContainer>
    ),
    [TransactionSteps.Success]: (
      <FooterButtonsContainer>
        <Button
          color="primaryBlue"
          type="button"
          disabled={isAmountFormButtonDisabled}
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

              // Navigate to "Home" with the pre-defined state
              navigate(RouterPath.Home, homeRoutesState);
            } else {
              // Navigate to "RateApp" when the application has not been rated in the store, and it's time to ask for a review.
              navigate(RouterPath.RateApp);
            }
          }}
        >
          <Trans t={t}>Done</Trans>
        </Button>
        {!isRecipientPublicKeyInContact && (
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
            TransactionSteps.Success === transferStep
              ? undefined
              : () => headerButtons[transferStep]
          }
        />
      )}
      renderContent={() => content[transferStep]}
      renderFooter={() => footerButtons[transferStep]}
    />
  );
};
