import React, { useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { MapNFTTokenStandardToName } from '@src/utils';

import { TransferNftContent } from '@popup/pages/transfer-nft/content';
import {
  getDefaultPaymentAmountBasedOnNftTokenStandard,
  getRuntimeArgs,
  signNftDeploy
} from '@popup/pages/transfer-nft/utils';
import { RouterPath, useTypedNavigate } from '@popup/router';

import {
  accountPendingTransactionsChanged,
  accountTrackingIdOfSentNftTokensChanged
} from '@background/redux/account-info/actions';
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
import {
  selectIsActiveAccountFromLedger,
  selectVaultActiveAccount
} from '@background/redux/vault/selectors';

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
import { dispatchFetchExtendedDeploysInfo } from '@libs/services/account-activity-service';
import {
  Button,
  HomePageTabsId,
  NoConnectedLedger,
  ReviewWithLedger,
  SvgIcon,
  TransferSuccessScreen
} from '@libs/ui/components';
import { calculateSubmitButtonDisabled } from '@libs/ui/forms/get-submit-button-state-from-validation';
import { useTransferNftForm } from '@libs/ui/forms/transfer-nft';
import { CSPRtoMotes } from '@libs/ui/utils';

export const TransferNftPage = () => {
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [haveReverseOwnerLookUp, setHaveReverseOwnerLookUp] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLedgerConnected, setIsLedgerConnected] = useState(false);
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

  const submitStakeWithLedger = () => {
    setShowLedgerConfirm(true);
  };

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

      const signDeploy = signNftDeploy(
        getRuntimeArgs(tokenStandard, args),
        CSPRtoMotes(paymentAmount),
        KEYS.publicKey,
        networkName,
        nftToken?.contract_package_hash!,
        [KEYS]
      );

      signDeploy
        .send(nodeUrl)
        .then((deployHash: string) => {
          dispatchToMainStore(recipientPublicKeyAdded(recipientPublicKey));

          if (deployHash) {
            dispatchToMainStore(
              accountTrackingIdOfSentNftTokensChanged({
                trackingId: nftToken.tracking_id,
                deployHash
              })
            );

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

            setShowSuccessScreen(true);
          }
        })
        .catch(error => {
          console.error(error, 'nft transfer request error');

          navigate(
            ErrorPath,
            createErrorLocationState({
              errorHeaderText: error.message || t('Something went wrong'),
              errorContentText:
                error.data ||
                t(
                  'Please check browser console for error details, this will be a valuable for our team to fix the issue.'
                ),
              errorPrimaryButtonLabel: t('Close'),
              errorRedirectPath: RouterPath.Home
            })
          );
        });
    }
  };

  return (
    <PopupLayout
      renderHeader={() => (
        <HeaderPopup
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={
            showSuccessScreen || (showLedgerConfirm && !isLedgerConnected)
              ? undefined
              : showLedgerConfirm && isLedgerConnected
                ? () => <HeaderSubmenuBarNavLink linkType="cancel" />
                : () => <HeaderSubmenuBarNavLink linkType="back" />
          }
        />
      )}
      renderContent={() =>
        showSuccessScreen ? (
          <TransferSuccessScreen headerText="You submitted a transaction" />
        ) : showLedgerConfirm ? (
          isLedgerConnected ? (
            <ReviewWithLedger
              txnHash={
                '017666eff4fcc0fd656c58dfe2e8fc22b765c05dc8a1be524b1ae4d90634ba9ab5'
              }
            />
          ) : (
            <NoConnectedLedger />
          )
        ) : (
          <TransferNftContent
            nftToken={nftToken}
            recipientForm={recipientForm}
            amountForm={amountForm}
            haveReverseOwnerLookUp={haveReverseOwnerLookUp}
          />
        )
      }
      renderFooter={
        showLedgerConfirm
          ? undefined
          : () => (
              <FooterButtonsContainer>
                {showSuccessScreen ? (
                  <>
                    <Button
                      color="primaryBlue"
                      type="button"
                      onClick={() => {
                        const currentDate = Date.now();

                        const shouldAskForReview =
                          askForReviewAfter == null ||
                          currentDate > askForReviewAfter;

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
                          const { recipientPublicKey } =
                            recipientForm.getValues();

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
                    color={
                      isActiveAccountFromLedger ? 'primaryRed' : 'primaryBlue'
                    }
                    type="button"
                    disabled={isButtonDisabled}
                    onClick={
                      isActiveAccountFromLedger
                        ? submitStakeWithLedger
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
            )
      }
    />
  );
};
