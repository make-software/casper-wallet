import { DeployUtil } from 'casper-js-sdk';
import React, { useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import {
  TransferNFTSteps,
  getDefaultPaymentAmountBasedOnNftTokenStandard,
  getRuntimeArgs
} from '@popup/pages/transfer-nft/utils';
import { RouterPath, useTypedLocation, useTypedNavigate } from '@popup/router';

import {
  accountPendingDeployHashesChanged,
  accountTrackingIdOfSentNftTokensChanged
} from '@background/redux/account-info/actions';
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

import { useLedger } from '@hooks/use-ledger';

import { createAsymmetricKey } from '@libs/crypto/create-asymmetric-key';
import { getRawPublicKey } from '@libs/entities/Account';
import {
  AlignedFlexRow,
  ErrorPath,
  FooterButtonsContainer,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  PopupLayout,
  SpacingSize,
  createErrorLocationState
} from '@libs/layout';
import { useFetchWalletBalance } from '@libs/services/balance-service';
import {
  makeNFTDeploy,
  sendSignDeploy,
  signDeploy
} from '@libs/services/deployer-service';
import { useFetchNftTokens } from '@libs/services/nft-service';
import {
  Button,
  HomePageTabsId,
  LedgerEventView,
  SvgIcon,
  TransferSuccessScreen,
  renderLedgerFooter
} from '@libs/ui/components';
import { calculateSubmitButtonDisabled } from '@libs/ui/forms/get-submit-button-state-from-validation';
import { useTransferNftForm } from '@libs/ui/forms/transfer-nft';
import { CSPRtoMotes } from '@libs/ui/utils';

import { ConfirmStep } from './confirm-step';
import { RecipientStep } from './recipient-step';
import { ReviewStep } from './review-step';

export const TransferNftPage = () => {
  const [transferNFTStep, setTransferNFTStep] = useState(
    TransferNFTSteps.Review
  );
  const [recipientName, setRecipientName] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [haveReverseOwnerLookUp, setHaveReverseOwnerLookUp] = useState(false);
  const [isSubmitButtonDisable, setIsSubmitButtonDisable] = useState(false);
  const [isRecipientFormButtonDisabled, setIsRecipientFormButtonDisabled] =
    useState(true);

  const { contractPackageHash, tokenId } = useParams();

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

  const { accountBalance } = useFetchWalletBalance();
  const { nftTokens } = useFetchNftTokens();

  const { t } = useTranslation();
  const navigate = useTypedNavigate();
  const location = useTypedLocation();

  const { nftData } = location.state;

  const nftToken = useMemo(
    () =>
      nftTokens?.find(
        token =>
          token.tokenId === tokenId &&
          token.contractPackageHash === contractPackageHash
      ),
    [contractPackageHash, nftTokens, tokenId]
  );

  useEffect(() => {
    if (!nftToken) {
      navigate(RouterPath.Home);
    }
  }, [navigate, nftToken]);

  useEffect(() => {
    if (nftToken?.owner_reverse_lookup_mode) {
      setHaveReverseOwnerLookUp(true);
    }
  }, [nftToken]);

  const tokenStandard = nftToken?.standard || '';

  const defaultPaymentAmount = useMemo(
    () => getDefaultPaymentAmountBasedOnNftTokenStandard(tokenStandard),
    [tokenStandard]
  );

  const { recipientForm, amountForm } = useTransferNftForm(
    accountBalance.liquidBalance,
    defaultPaymentAmount
  );

  const { getValues, trigger } = amountForm;

  useEffect(() => {
    trigger('paymentAmount');
  }, [trigger]);

  const isAmountFormButtonDisabled = calculateSubmitButtonDisabled({
    isValid: amountForm.formState.isValid
  });

  const { recipientPublicKey } = recipientForm.getValues();
  const isRecipientPublicKeyInContact = useMemo(
    () => contactPublicKeys.includes(recipientPublicKey),
    [contactPublicKeys, recipientPublicKey]
  );

  const submitTransfer = async () => {
    if (haveReverseOwnerLookUp || !nftToken) return;

    setIsSubmitButtonDisable(true);

    if (activeAccount) {
      const { recipientPublicKey } = recipientForm.getValues();
      const { paymentAmount } = amountForm.getValues();

      const KEYS = createAsymmetricKey(
        activeAccount.publicKey,
        activeAccount.secretKey
      );

      const args = {
        tokenId: nftToken.tokenId,
        source: KEYS.publicKey,
        target: getRawPublicKey(recipientPublicKey)
      };

      const deploy = await makeNFTDeploy(
        getRuntimeArgs(tokenStandard, args),
        CSPRtoMotes(paymentAmount),
        KEYS.publicKey,
        networkName,
        nftToken?.contractPackageHash!,
        nodeUrl
      );

      const signedDeploy = await signDeploy(deploy, [KEYS], activeAccount);

      sendSignDeploy(signedDeploy, nodeUrl)
        .then(resp => {
          dispatchToMainStore(recipientPublicKeyAdded(recipientPublicKey));

          if ('result' in resp) {
            const deployHash = resp.result.deploy_hash;

            dispatchToMainStore(
              accountTrackingIdOfSentNftTokensChanged({
                trackingId: nftToken.trackingId,
                deployHash
              })
            );

            dispatchToMainStore(accountPendingDeployHashesChanged(deployHash));

            setTransferNFTStep(TransferNFTSteps.Success);
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
          console.error(error, 'nft transfer request error');

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
    setTransferNFTStep(TransferNFTSteps.ConfirmWithLedger);

    if (haveReverseOwnerLookUp || !nftToken || !activeAccount) return;

    const KEYS = createAsymmetricKey(
      activeAccount.publicKey,
      activeAccount.secretKey
    );

    const args = {
      tokenId: nftToken.tokenId,
      source: KEYS.publicKey,
      target: getRawPublicKey(recipientPublicKey)
    };

    const deploy = await makeNFTDeploy(
      getRuntimeArgs(tokenStandard, args),
      CSPRtoMotes(paymentAmount),
      KEYS.publicKey,
      networkName,
      nftToken?.contractPackageHash!,
      nodeUrl
    );

    dispatchToMainStore(
      ledgerDeployChanged(JSON.stringify(DeployUtil.deployToJson(deploy)))
    );
    dispatchToMainStore(
      ledgerRecipientToSaveOnSuccessChanged(recipientPublicKey)
    );
  };

  const { ledgerEventStatusToRender, makeSubmitLedgerAction } = useLedger({
    ledgerAction: submitTransfer,
    beforeLedgerActionCb
  });

  const content = {
    [TransferNFTSteps.Review]: (
      <ReviewStep
        nftToken={nftToken}
        haveReverseOwnerLookUp={haveReverseOwnerLookUp}
        amountForm={amountForm}
        nftData={nftData}
      />
    ),
    [TransferNFTSteps.Recipient]: (
      <RecipientStep
        recipientForm={recipientForm}
        setRecipientName={setRecipientName}
        recipientName={recipientName}
        setIsRecipientFormButtonDisabled={setIsRecipientFormButtonDisabled}
        haveReverseOwnerLookUp={haveReverseOwnerLookUp}
      />
    ),
    [TransferNFTSteps.Confirm]: (
      <ConfirmStep
        paymentAmount={paymentAmount}
        recipientName={recipientName}
        nftToken={nftToken}
        nftData={nftData}
        recipientPublicKey={recipientPublicKey}
      />
    ),
    [TransferNFTSteps.ConfirmWithLedger]: (
      <LedgerEventView event={ledgerEventStatusToRender} />
    ),
    [TransferNFTSteps.Success]: (
      <TransferSuccessScreen headerText="You submitted a transaction" />
    )
  };

  const headerButtons = {
    [TransferNFTSteps.Review]: <HeaderSubmenuBarNavLink linkType="back" />,
    [TransferNFTSteps.Recipient]: (
      <HeaderSubmenuBarNavLink
        onClick={() => setTransferNFTStep(TransferNFTSteps.Review)}
        linkType="back"
      />
    ),
    [TransferNFTSteps.Confirm]: (
      <HeaderSubmenuBarNavLink
        onClick={() => setTransferNFTStep(TransferNFTSteps.Recipient)}
        linkType="back"
      />
    ),
    [TransferNFTSteps.ConfirmWithLedger]: (
      <HeaderSubmenuBarNavLink
        linkType="back"
        onClick={() => setTransferNFTStep(TransferNFTSteps.Confirm)}
      />
    )
  };

  const ledgerFooterButton = renderLedgerFooter({
    onConnect: makeSubmitLedgerAction,
    event: ledgerEventStatusToRender,
    onErrorCtaPressed: () => setTransferNFTStep(TransferNFTSteps.Confirm)
  });

  const footerButtons = {
    [TransferNFTSteps.Review]: (
      <FooterButtonsContainer>
        <Button
          disabled={isAmountFormButtonDisabled}
          onClick={() => {
            const { paymentAmount } = getValues();

            setPaymentAmount(paymentAmount);
            setTransferNFTStep(TransferNFTSteps.Recipient);
          }}
        >
          <Trans t={t}>Next</Trans>
        </Button>
      </FooterButtonsContainer>
    ),
    [TransferNFTSteps.Recipient]: (
      <FooterButtonsContainer>
        <Button
          disabled={isRecipientFormButtonDisabled}
          onClick={() => setTransferNFTStep(TransferNFTSteps.Confirm)}
        >
          <Trans t={t}>Next</Trans>
        </Button>
      </FooterButtonsContainer>
    ),
    [TransferNFTSteps.Confirm]: (
      <FooterButtonsContainer>
        <Button
          color={isActiveAccountFromLedger ? 'primaryRed' : 'primaryBlue'}
          type="button"
          onClick={
            isActiveAccountFromLedger
              ? makeSubmitLedgerAction()
              : submitTransfer
          }
          disabled={isSubmitButtonDisable}
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
      </FooterButtonsContainer>
    ),
    [TransferNFTSteps.ConfirmWithLedger]: ledgerFooterButton ? (
      ledgerFooterButton()
    ) : (
      <></>
    ),
    [TransferNFTSteps.Success]: (
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
            onClick={() => {
              const { recipientPublicKey } = recipientForm.getValues();

              navigate(RouterPath.AddContact, {
                state: {
                  recipientPublicKey: recipientPublicKey
                }
              });
            }}
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
            transferNFTStep === TransferNFTSteps.Success
              ? undefined
              : () => headerButtons[transferNFTStep]
          }
        />
      )}
      renderContent={() => content[transferNFTStep]}
      renderFooter={() => footerButtons[transferNFTStep]}
    />
  );
};
