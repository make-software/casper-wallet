import React, { useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import {
  MapNFTTokenStandardToName,
  fetchAndDispatchExtendedDeployInfo
} from '@src/utils';

import {
  TransferNFTSteps,
  getDefaultPaymentAmountBasedOnNftTokenStandard,
  getRuntimeArgs
} from '@popup/pages/transfer-nft/utils';
import { RouterPath, useTypedLocation, useTypedNavigate } from '@popup/router';

import { accountTrackingIdOfSentNftTokensChanged } from '@background/redux/account-info/actions';
import {
  selectAccountBalance,
  selectAccountNftTokens
} from '@background/redux/account-info/selectors';
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
import { getRawPublicKey } from '@libs/entities/Account';
import {
  ErrorPath,
  FooterButtonsContainer,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  PopupLayout,
  createErrorLocationState
} from '@libs/layout';
import {
  makeNFTDeployAndSign,
  sendSignDeploy
} from '@libs/services/deployer-service';
import {
  Button,
  HomePageTabsId,
  TransferSuccessScreen
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

  const { contractPackageHash, tokenId } = useParams();

  const nftTokens = useSelector(selectAccountNftTokens);
  const csprBalance = useSelector(selectAccountBalance);
  const activeAccount = useSelector(selectVaultActiveAccount);
  const { networkName, nodeUrl } = useSelector(
    selectApiConfigBasedOnActiveNetwork
  );
  const contactPublicKeys = useSelector(selectAllPublicKeys);
  const ratedInStore = useSelector(selectRatedInStore);
  const askForReviewAfter = useSelector(selectAskForReviewAfter);

  const { t } = useTranslation();
  const navigate = useTypedNavigate();
  const location = useTypedLocation();

  const { nftData } = location.state;

  const nftToken = useMemo(
    () =>
      nftTokens?.find(
        token =>
          token.token_id === tokenId &&
          token.contract_package_hash === contractPackageHash
      ),
    [contractPackageHash, nftTokens, tokenId]
  );

  useEffect(() => {
    if (!nftToken) {
      navigate(RouterPath.Home);
    }
  }, [navigate, nftToken]);

  useEffect(() => {
    if (nftToken?.contract_package?.metadata?.owner_reverse_lookup_mode) {
      setHaveReverseOwnerLookUp(true);
    }
  }, [nftToken]);

  const tokenStandard = nftToken
    ? MapNFTTokenStandardToName[nftToken.token_standard_id]
    : '';

  const defaultPaymentAmount = useMemo(
    () => getDefaultPaymentAmountBasedOnNftTokenStandard(tokenStandard),
    [tokenStandard]
  );

  const { recipientForm, amountForm } = useTransferNftForm(
    csprBalance.liquidMotes,
    defaultPaymentAmount
  );

  const { getValues, trigger } = amountForm;

  useEffect(() => {
    trigger('paymentAmount');
  }, [trigger]);

  const isRecipientFormButtonDisabled = calculateSubmitButtonDisabled({
    isValid: recipientForm.formState.isValid && !haveReverseOwnerLookUp
  });
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
        tokenId: nftToken.token_id,
        source: KEYS.publicKey,
        target: getRawPublicKey(recipientPublicKey)
      };

      const signDeploy = await makeNFTDeployAndSign(
        getRuntimeArgs(tokenStandard, args),
        CSPRtoMotes(paymentAmount),
        KEYS.publicKey,
        networkName,
        nftToken?.contract_package_hash!,
        nodeUrl,
        [KEYS]
      );

      sendSignDeploy(signDeploy, nodeUrl)
        .then(resp => {
          dispatchToMainStore(recipientPublicKeyAdded(recipientPublicKey));

          if ('result' in resp) {
            const deployHash = resp.result.deploy_hash;

            dispatchToMainStore(
              accountTrackingIdOfSentNftTokensChanged({
                trackingId: nftToken.tracking_id,
                deployHash
              })
            );

            fetchAndDispatchExtendedDeployInfo(deployHash);

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
    )
  };

  const footerButtons = {
    [TransferNFTSteps.Review]: (
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
    ),
    [TransferNFTSteps.Recipient]: (
      <Button
        disabled={isRecipientFormButtonDisabled}
        onClick={() => setTransferNFTStep(TransferNFTSteps.Confirm)}
      >
        <Trans t={t}>Next</Trans>
      </Button>
    ),
    [TransferNFTSteps.Confirm]: (
      <Button
        color="primaryRed"
        type="button"
        onClick={submitTransfer}
        disabled={isSubmitButtonDisable}
      >
        <Trans t={t}>Confirm send</Trans>
      </Button>
    ),
    [TransferNFTSteps.Success]: (
      <>
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
      </>
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
      renderFooter={() => (
        <FooterButtonsContainer>
          {footerButtons[transferNFTStep]}
        </FooterButtonsContainer>
      )}
    />
  );
};
