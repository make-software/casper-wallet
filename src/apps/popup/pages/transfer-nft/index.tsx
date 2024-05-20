import { DeployUtil } from 'casper-js-sdk';
import React, { useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import {
  MapNFTTokenStandardToName,
  fetchAndDispatchExtendedDeployInfo
} from '@src/utils';

import { TransferNftContent } from '@popup/pages/transfer-nft/content';
import {
  getDefaultPaymentAmountBasedOnNftTokenStandard,
  getRuntimeArgs
} from '@popup/pages/transfer-nft/utils';
import { RouterPath, useTypedNavigate } from '@popup/router';

import { accountTrackingIdOfSentNftTokensChanged } from '@background/redux/account-info/actions';
import {
  selectAccountBalance,
  selectAccountNftTokens
} from '@background/redux/account-info/selectors';
import { selectAllPublicKeys } from '@background/redux/contacts/selectors';
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
import {
  makeNFTDeploy,
  sendSignDeploy,
  signDeploy
} from '@libs/services/deployer-service';
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

export const TransferNftPage = () => {
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [haveReverseOwnerLookUp, setHaveReverseOwnerLookUp] = useState(false);
  const [showLedgerConfirm, setShowLedgerConfirm] = useState(false);

  const { contractPackageHash, tokenId } = useParams();

  const nftTokens = useSelector(selectAccountNftTokens);
  const csprBalance = useSelector(selectAccountBalance);
  const activeAccount = useSelector(selectVaultActiveAccount);
  const isActiveAccountFromLedger = useSelector(
    selectIsActiveAccountFromLedger
  );
  const { networkName, nodeUrl } = useSelector(
    selectApiConfigBasedOnActiveNetwork
  );
  const contactPublicKeys = useSelector(selectAllPublicKeys);
  const ratedInStore = useSelector(selectRatedInStore);
  const askForReviewAfter = useSelector(selectAskForReviewAfter);

  const { t } = useTranslation();
  const navigate = useTypedNavigate();

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

  const paymentAmount = useMemo(
    () => getDefaultPaymentAmountBasedOnNftTokenStandard(tokenStandard),
    [tokenStandard]
  );

  const { recipientForm, amountForm } = useTransferNftForm(
    csprBalance.liquidMotes,
    paymentAmount
  );

  useEffect(() => {
    amountForm.trigger('paymentAmount');
  }, [amountForm]);

  const isButtonDisabled = calculateSubmitButtonDisabled({
    isValid:
      recipientForm.formState.isValid &&
      amountForm.formState.isValid &&
      !haveReverseOwnerLookUp
  });
  const { recipientPublicKey } = recipientForm.getValues();
  const isRecipientPublicKeyInContact = useMemo(
    () => contactPublicKeys.includes(recipientPublicKey),
    [contactPublicKeys, recipientPublicKey]
  );

  const submitTransfer = async () => {
    if (haveReverseOwnerLookUp || !nftToken) return;

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

      const deploy = await makeNFTDeploy(
        getRuntimeArgs(tokenStandard, args),
        CSPRtoMotes(paymentAmount),
        KEYS.publicKey,
        networkName,
        nftToken?.contract_package_hash!,
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
                trackingId: nftToken.tracking_id,
                deployHash
              })
            );

            fetchAndDispatchExtendedDeployInfo(deployHash);

            setShowSuccessScreen(true);
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
    setShowLedgerConfirm(true);

    if (haveReverseOwnerLookUp || !nftToken || !activeAccount) return;

    const KEYS = createAsymmetricKey(
      activeAccount.publicKey,
      activeAccount.secretKey
    );

    const args = {
      tokenId: nftToken.token_id,
      source: KEYS.publicKey,
      target: getRawPublicKey(recipientPublicKey)
    };

    const deploy = await makeNFTDeploy(
      getRuntimeArgs(tokenStandard, args),
      CSPRtoMotes(paymentAmount),
      KEYS.publicKey,
      networkName,
      nftToken?.contract_package_hash!,
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

  const renderFooter = () => {
    if (showLedgerConfirm && !showSuccessScreen) {
      return renderLedgerFooter({
        onConnect: makeSubmitLedgerAction,
        event: ledgerEventStatusToRender,
        onErrorCtaPressed: () => setShowLedgerConfirm(false)
      });
    }

    return () => (
      <FooterButtonsContainer>
        {showSuccessScreen ? (
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
        ) : (
          <Button
            color={isActiveAccountFromLedger ? 'primaryRed' : 'primaryBlue'}
            type="button"
            disabled={isButtonDisabled}
            onClick={
              isActiveAccountFromLedger
                ? makeSubmitLedgerAction()
                : submitTransfer
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
        )}
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
          renderSubmenuBarItems={
            showSuccessScreen
              ? undefined
              : showLedgerConfirm
                ? () => (
                    <HeaderSubmenuBarNavLink
                      linkType="back"
                      onClick={() => setShowLedgerConfirm(false)}
                    />
                  )
                : () => <HeaderSubmenuBarNavLink linkType="back" />
          }
        />
      )}
      renderContent={() =>
        showSuccessScreen ? (
          <TransferSuccessScreen headerText="You submitted a transaction" />
        ) : showLedgerConfirm ? (
          <LedgerEventView event={ledgerEventStatusToRender} />
        ) : (
          <TransferNftContent
            nftToken={nftToken}
            recipientForm={recipientForm}
            amountForm={amountForm}
            haveReverseOwnerLookUp={haveReverseOwnerLookUp}
          />
        )
      }
      renderFooter={renderFooter()}
    />
  );
};
