import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';

import {
  FooterButtonsContainer,
  HeaderSubmenuBarNavLink,
  PopupHeader,
  PopupLayout
} from '@libs/layout';
import { TransferNftContent } from '@popup/pages/transfer-nft/content';
import {
  selectAccountBalance,
  selectAccountNftTokens
} from '@background/redux/account-info/selectors';
import { CSPRtoMotes } from '@libs/ui/utils/formatters';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { MapNFTTokenStandardToName } from '@src/utils';
import { getRawPublicKey } from '@libs/entities/Account';
import { useTransferNftForm } from '@libs/ui/forms/transfer-nft';
import { calculateSubmitButtonDisabled } from '@libs/ui/forms/get-submit-button-state-from-validation';
import { HomePageTabsId, TransferSuccessScreen, Button } from '@libs/ui';
import { RouterPath, useTypedNavigate } from '@popup/router';
import {
  getDefaultPaymentAmountBasedOnNftTokenStandard,
  getRuntimeArgs,
  signNftDeploy
} from '@popup/pages/transfer-nft/utils';
import { dispatchToMainStore } from '@background/redux/utils';
import { recipientPublicKeyAdded } from '@background/redux/recent-recipient-public-keys/actions';
import { dispatchFetchExtendedDeploysInfo } from '@libs/services/account-activity-service';
import {
  accountPendingTransactionsChanged,
  accountTrackingIdOfSentNftTokensChanged
} from '@background/redux/account-info/actions';
import { createAsymmetricKey } from '@libs/crypto/create-asymmetric-key';
import { createErrorLocationState, ErrorPath } from '@layout/error';

export const TransferNftPage = () => {
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [haveReverseOwnerLookUp, setHaveReverseOwnerLookUp] = useState(false);
  const { contractPackageHash, tokenId } = useParams();

  const nftTokens = useSelector(selectAccountNftTokens);
  const csprBalance = useSelector(selectAccountBalance);
  const activeAccount = useSelector(selectVaultActiveAccount);
  const { networkName, nodeUrl } = useSelector(
    selectApiConfigBasedOnActiveNetwork
  );

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
    csprBalance.amountMotes,
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

      signDeploy.send(nodeUrl).then((deployHash: string) => {
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
  };

  return (
    <PopupLayout
      renderHeader={() => (
        <PopupHeader
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={
            showSuccessScreen
              ? undefined
              : () => <HeaderSubmenuBarNavLink linkType="back" />
          }
        />
      )}
      renderContent={() =>
        showSuccessScreen ? (
          <TransferSuccessScreen headerText="You’ve sent the NFT" />
        ) : (
          <TransferNftContent
            nftToken={nftToken}
            recipientForm={recipientForm}
            amountForm={amountForm}
            haveReverseOwnerLookUp={haveReverseOwnerLookUp}
          />
        )
      }
      renderFooter={() => (
        <FooterButtonsContainer>
          {showSuccessScreen ? (
            <Button
              color="primaryBlue"
              type="button"
              onClick={() => {
                navigate(RouterPath.Home, {
                  state: {
                    // set the active tab to deploys
                    activeTabId: HomePageTabsId.Deploys
                  }
                });
              }}
            >
              <Trans t={t}>Done</Trans>
            </Button>
          ) : (
            <Button
              color="primaryBlue"
              type="button"
              disabled={isButtonDisabled}
              onClick={submitTransfer}
            >
              <Trans t={t}>Confirm send</Trans>
            </Button>
          )}
        </FooterButtonsContainer>
      )}
    />
  );
};
