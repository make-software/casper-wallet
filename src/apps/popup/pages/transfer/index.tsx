import {
  Deploy,
  makeCep18TransferDeploy,
  makeCsprTransferDeploy
} from 'casper-js-sdk';
import React, { useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import {
  ERC20_PAYMENT_AMOUNT_AVERAGE_MOTES,
  networkNameToSdkNetworkNameMap
} from '@src/constants';

import { RouterPath, useTypedLocation, useTypedNavigate } from '@popup/router';

import { accountPendingDeployHashesChanged } from '@background/redux/account-info/actions';
import { selectAllContactsPublicKeys } from '@background/redux/contacts/selectors';
import {
  ledgerDeployChanged,
  ledgerRecipientToSaveOnSuccessChanged
} from '@background/redux/ledger/actions';
import {
  selectAskForReviewAfter,
  selectRatedInStore
} from '@background/redux/rate-app/selectors';
import { recipientPublicKeyAdded } from '@background/redux/recent-recipient-public-keys/actions';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
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
import { sendSignDeploy, signDeploy } from '@libs/services/deployer-service';
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

  const sendDeploy = (signDeploy: Deploy) => {
    sendSignDeploy(signDeploy, nodeUrl)
      .then(resp => {
        dispatchToMainStore(recipientPublicKeyAdded(recipientPublicKey));

        if ('result' in resp) {
          dispatchToMainStore(
            accountPendingDeployHashesChanged(resp.result.deploy_hash)
          );

          setTransferStep(TransactionSteps.Success);
        } else {
          navigate(
            ErrorPath,
            createErrorLocationState({
              errorHeaderText: resp.error.message || t('Something went wrong'),
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
    setIsSubmitButtonDisable(true);

    if (!activeAccount) {
      return;
    }

    const KEYS = createAsymmetricKeys(
      activeAccount.publicKey,
      activeAccount.secretKey
    );

    if (isErc20Transfer && selectedToken?.contractHash) {
      // CEP18 transfer
      const deploy = makeCep18TransferDeploy({
        chainName: networkNameToSdkNetworkNameMap[networkName],
        contractHash: selectedToken.contractHash,
        paymentAmount: CSPRtoMotes(paymentAmount),
        recipientPublicKeyHex: recipientPublicKey,
        senderPublicKeyHex: activeAccount.publicKey,
        transferAmount:
          multiplyErc20Balance(amount, selectedToken?.decimals ?? 0) ?? '0'
      });

      const signedDeploy = await signDeploy(deploy, KEYS, activeAccount);

      sendDeploy(signedDeploy);
    } else {
      // CSPR transfer
      const motesAmount = CSPRtoMotes(amount);

      const deploy = makeCsprTransferDeploy({
        chainName: networkNameToSdkNetworkNameMap[networkName],
        memo: transferIdMemo,
        recipientPublicKeyHex: recipientPublicKey,
        senderPublicKeyHex: activeAccount.publicKey,
        transferAmount: motesAmount
      });

      const signedDeploy = await signDeploy(deploy, KEYS, activeAccount);

      sendDeploy(signedDeploy);
    }
  };

  const beforeLedgerActionCb = async () => {
    setTransferStep(TransactionSteps.ConfirmWithLedger);

    if (activeAccount?.hardware === HardwareWalletType.Ledger) {
      if (isErc20Transfer && selectedToken?.contractHash) {
        const deploy = makeCep18TransferDeploy({
          chainName: networkNameToSdkNetworkNameMap[networkName],
          contractHash: selectedToken.contractHash,
          paymentAmount: CSPRtoMotes(paymentAmount),
          recipientPublicKeyHex: recipientPublicKey,
          senderPublicKeyHex: activeAccount.publicKey,
          transferAmount:
            multiplyErc20Balance(amount, selectedToken?.decimals ?? 0) ?? '0'
        });

        dispatchToMainStore(
          ledgerDeployChanged(JSON.stringify(Deploy.toJson(deploy)))
        );
        dispatchToMainStore(
          ledgerRecipientToSaveOnSuccessChanged(recipientPublicKey)
        );
      } else {
        const motesAmount = CSPRtoMotes(amount);

        const deploy = makeCsprTransferDeploy({
          chainName: networkNameToSdkNetworkNameMap[networkName],
          memo: transferIdMemo,
          recipientPublicKeyHex: recipientPublicKey,
          senderPublicKeyHex: activeAccount.publicKey,
          transferAmount: motesAmount
        });

        dispatchToMainStore(
          ledgerDeployChanged(JSON.stringify(Deploy.toJson(deploy)))
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
