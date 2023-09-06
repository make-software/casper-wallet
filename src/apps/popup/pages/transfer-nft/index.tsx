import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { CLPublicKey, CLPublicKeyTag, Keys } from 'casper-js-sdk';
import { CEP47Client } from 'casper-cep47-js-client';
import { CEP78Client, OwnerReverseLookupMode } from 'casper-cep78-js-client';

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
import { CSPRtoMotes, motesToCSPR } from '@libs/ui/utils/formatters';
import { ERC20_PAYMENT_AMOUNT_AVERAGE_MOTES } from '@src/constants';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { MapNFTTokenStandardToName, NFTTokenStandard } from '@src/utils';
import { getRawPublicKey } from '@libs/entities/Account';
import { useTransferNftForm } from '@libs/ui/forms/transfer-nft';
import { calculateSubmitButtonDisabled } from '@libs/ui/forms/get-submit-button-state-from-validation';
import { HomePageTabsId, TransferSuccessScreen, Button } from '@libs/ui';
import { RouterPath, useTypedNavigate } from '@popup/router';

// TODO: move to utils or service
const getContractHash = (url: string, contractPackageHash: string) =>
  fetch(
    `${url}/contracts?contract_package_hash=${contractPackageHash}&order_by=timestamp&order_direction=desc`
  )
    .then(res => res.json())
    .then(res => res.data[0].contract_hash);

export const TransferNftPage = () => {
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const { contractPackageHash, tokenId } = useParams();

  const nftTokes = useSelector(selectAccountNftTokens);

  const nftToken = useMemo(
    () =>
      nftTokes?.find(
        token =>
          token.token_id === tokenId &&
          token.contract_package_hash === contractPackageHash
      ),
    [contractPackageHash, nftTokes, tokenId]
  );

  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  const csprBalance = useSelector(selectAccountBalance);
  const activeAccount = useSelector(selectVaultActiveAccount);
  const { networkName, casperApiUrl } = useSelector(
    selectApiConfigBasedOnActiveNetwork
  );

  const { recipientForm, amountForm } = useTransferNftForm(
    csprBalance.amountMotes,
    // TODO: use right payment amount
    motesToCSPR(ERC20_PAYMENT_AMOUNT_AVERAGE_MOTES)
  );

  const tokenStandard = nftToken
    ? MapNFTTokenStandardToName[nftToken.token_standard_id]
    : '';

  // TODO: move to utils
  const getSignatureAlgorithm = (rawPublicKey: CLPublicKey) => {
    switch (rawPublicKey.tag) {
      case CLPublicKeyTag.ED25519:
        return Keys.SignatureAlgorithm.Ed25519;
      case CLPublicKeyTag.SECP256K1:
        return Keys.SignatureAlgorithm.Secp256K1;
      default:
        throw Error('Unknown Signature type.');
    }
  };

  useEffect(() => {
    amountForm.trigger('paymentAmount');
  }, [amountForm]);

  const isButtonDisabled = calculateSubmitButtonDisabled({
    isValid: recipientForm.formState.isValid && amountForm.formState.isValid
  });

  const submitTransfer = async () => {
    if (tokenStandard === NFTTokenStandard.CEP47) {
      if (activeAccount) {
        const { recipientPublicKey } = recipientForm.getValues();
        const { paymentAmount } = amountForm.getValues();
        const rawPublicKey = getRawPublicKey(activeAccount.publicKey);

        const cep47 = new CEP47Client(`${casperApiUrl}/rpc`, networkName);

        const contractHash = await getContractHash(
          casperApiUrl,
          nftToken?.contract_package_hash!
        );

        cep47.setContractHash(
          `hash-${contractHash}`,
          `hash-${nftToken?.contract_package?.contract_package_hash!}`
        );

        const KEYS = Keys.getKeysFromHexPrivKey(
          activeAccount.secretKey,
          getSignatureAlgorithm(rawPublicKey)
        );

        const transferOneDeploy = await cep47.transfer(
          getRawPublicKey(recipientPublicKey),
          [nftToken?.token_id!],
          CSPRtoMotes(paymentAmount),
          KEYS.publicKey,
          [KEYS]
        );

        console.log(transferOneDeploy);

        // const res = await transferOneDeploy.send(`${casperApiUrl}/rpc`);

        // console.log(res);
      }
    } else if (tokenStandard === NFTTokenStandard.CEP78) {
      if (activeAccount) {
        const { recipientPublicKey } = recipientForm.getValues();
        const { paymentAmount } = amountForm.getValues();
        console.log(paymentAmount);
        const rawPublicKey = getRawPublicKey(activeAccount.publicKey);
        // 'https://rpc.testnet.casperlabs.io/rpc' - works
        // 'https://casper-node-proxy.dev.make.services/rpc' - 503
        // 'https://cspr-node-proxy.dev.make.services/rpc' - 502
        // 'https://cspr-testnet-node-proxy.make.services/rpc' - 502

        // Creating a new instance of the CEP78Client
        const cep78 = new CEP78Client(
          `https://rpc.testnet.casperlabs.io/rpc`,
          networkName
        );

        const KEYS = Keys.getKeysFromHexPrivKey(
          activeAccount.secretKey,
          getSignatureAlgorithm(rawPublicKey)
        );

        console.log(nftToken);

        const contractHash = await getContractHash(
          casperApiUrl,
          nftToken?.contract_package_hash!
        );
        console.log(contractHash);

        // set the contract hash on the CEP78Client instance
        cep78.setContractHash(`hash-${contractHash}`);

        console.log(await cep78.getReportingModeConfig());

        // get the owner reverse lookup mode setting
        const ownerReverseLookupModeSetting =
          nftToken?.contract_package?.metadata?.owner_reverse_lookup_mode;
        console.log(`OwnerReverseLookupMode: ${ownerReverseLookupModeSetting}`);

        const useSessionCode =
          ownerReverseLookupModeSetting ===
          OwnerReverseLookupMode[OwnerReverseLookupMode.Complete];

        const transferDeploy = cep78.transfer(
          {
            tokenId: nftToken?.token_id!,
            source: KEYS.publicKey,
            target: getRawPublicKey(recipientPublicKey)
          },
          { useSessionCode },
          CSPRtoMotes(paymentAmount),
          KEYS.publicKey,
          [KEYS]
        );

        console.log(transferDeploy, 'transferDeploy');

        setShowSuccessScreen(true);
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
            <HeaderSubmenuBarNavLink linkType="back" />
          )}
        />
      )}
      renderContent={() =>
        showSuccessScreen ? (
          <TransferSuccessScreen isNftTransfer={true} />
        ) : (
          <TransferNftContent
            nftToken={nftToken}
            recipientForm={recipientForm}
            amountForm={amountForm}
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
