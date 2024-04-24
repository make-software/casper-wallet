import { DeployUtil } from 'casper-js-sdk';
import React, { useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { ERC20_PAYMENT_AMOUNT_AVERAGE_MOTES } from '@src/constants';
import { fetchAndDispatchExtendedDeployInfo } from '@src/utils';

import { RouterPath, useTypedLocation, useTypedNavigate } from '@popup/router';

import { selectAllPublicKeys } from '@background/redux/contacts/selectors';
import {
  selectAskForReviewAfter,
  selectRatedInStore
} from '@background/redux/rate-app/selectors';
import { recipientPublicKeyAdded } from '@background/redux/recent-recipient-public-keys/actions';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';

import { TokenType, useCasperToken } from '@hooks/use-casper-token';

import { createAsymmetricKey } from '@libs/crypto/create-asymmetric-key';
import {
  ErrorPath,
  FooterButtonsContainer,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  PopupLayout,
  createErrorLocationState
} from '@libs/layout';
import { HeaderSubmenuBarBuyCSPRLink } from '@libs/layout/header/header-submenu-bar-buy-cspr-link';
import {
  makeCep18TransferDeployAndSign,
  makeNativeTransferDeployAndSign,
  sendSignDeploy
} from '@libs/services/deployer-service';
import {
  Button,
  HomePageTabsId,
  TransferSuccessScreen
} from '@libs/ui/components';
import { CSPRtoMotes, motesToCSPR } from '@libs/ui/utils';

import { AmountStep } from './amount-step';
import { ConfirmStep } from './confirm-step';
import { RecipientStep } from './recipient-step';
import { TokenStep } from './token-step';
import { TransactionSteps } from './utils';

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
  const [isSubmitButtonDisable, setIsSubmitButtonDisable] = useState(true);

  const activeAccount = useSelector(selectVaultActiveAccount);
  const { networkName, nodeUrl } = useSelector(
    selectApiConfigBasedOnActiveNetwork
  );
  const contactPublicKeys = useSelector(selectAllPublicKeys);
  const ratedInStore = useSelector(selectRatedInStore);
  const askForReviewAfter = useSelector(selectAskForReviewAfter);

  const casperToken = useCasperToken();

  useEffect(() => {
    const tokenData = location?.state?.tokenData;

    if (selectedToken) {
      return;
    }

    if (tokenData) {
      setIsErc20Transfer(true);
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

  const sendDeploy = (signDeploy: DeployUtil.Deploy) => {
    sendSignDeploy(signDeploy, nodeUrl)
      .then(resp => {
        dispatchToMainStore(recipientPublicKeyAdded(recipientPublicKey));

        if ('result' in resp) {
          fetchAndDispatchExtendedDeployInfo(resp.result.deploy_hash);

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
    if (activeAccount) {
      const KEYS = createAsymmetricKey(
        activeAccount.publicKey,
        activeAccount.secretKey
      );
      if (isErc20Transfer) {
        // ERC20 transfer
        const signDeploy = await makeCep18TransferDeployAndSign(
          nodeUrl,
          networkName,
          selectedToken?.contractHash,
          selectedToken?.id,
          recipientPublicKey,
          amount,
          selectedToken?.decimals || null,
          paymentAmount,
          activeAccount,
          [KEYS]
        );

        sendDeploy(signDeploy);
      } else {
        // CSPR transfer
        const motesAmount = CSPRtoMotes(amount);

        const signDeploy = await makeNativeTransferDeployAndSign(
          activeAccount.publicKey,
          recipientPublicKey,
          motesAmount,
          networkName,
          nodeUrl,
          [KEYS],
          transferIdMemo
        );

        sendDeploy(signDeploy);
      }
    }
  };

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
    [TransactionSteps.Confirm]: (
      <ConfirmStep
        recipientPublicKey={recipientPublicKey}
        amount={amount}
        balance={selectedToken?.amount || null}
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
      <>
        <HeaderSubmenuBarNavLink linkType="back" />
        <HeaderSubmenuBarBuyCSPRLink />
      </>
    ),
    [TransactionSteps.Recipient]: (
      <>
        <HeaderSubmenuBarNavLink
          linkType="back"
          onClick={() => setTransferStep(TransactionSteps.Token)}
        />
        <HeaderSubmenuBarBuyCSPRLink />
      </>
    ),
    [TransactionSteps.Amount]: (
      <>
        <HeaderSubmenuBarNavLink
          linkType="back"
          onClick={() => setTransferStep(TransactionSteps.Recipient)}
        />
        <HeaderSubmenuBarBuyCSPRLink />
      </>
    ),
    [TransactionSteps.Confirm]: (
      <>
        <HeaderSubmenuBarNavLink
          linkType="back"
          onClick={() => setTransferStep(TransactionSteps.Amount)}
        />
        <HeaderSubmenuBarBuyCSPRLink />
      </>
    )
  };

  const footerButtons = {
    [TransactionSteps.Token]: (
      <Button
        color="primaryBlue"
        type="button"
        onClick={() => {
          setTransferStep(TransactionSteps.Recipient);
        }}
      >
        <Trans t={t}>Next</Trans>
      </Button>
    ),
    [TransactionSteps.Recipient]: (
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
    ),
    [TransactionSteps.Amount]: (
      <Button
        color="primaryBlue"
        type="button"
        disabled={isAmountFormButtonDisabled}
        onClick={() => {
          setTransferStep(TransactionSteps.Confirm);
        }}
      >
        <Trans t={t}>Next</Trans>
      </Button>
    ),
    [TransactionSteps.Confirm]: (
      <Button
        color="primaryBlue"
        type="button"
        disabled={
          isSubmitButtonDisable ||
          isRecipientFormButtonDisabled ||
          isAmountFormButtonDisabled
        }
        onClick={onSubmitSending}
      >
        <Trans t={t}>Confirm send</Trans>
      </Button>
    ),
    [TransactionSteps.Success]: (
      <>
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
        {isRecipientPublicKeyInContact && (
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
            TransactionSteps.Success === transferStep
              ? undefined
              : () => headerButtons[transferStep]
          }
        />
      )}
      renderContent={() => content[transferStep]}
      renderFooter={() => (
        <FooterButtonsContainer>
          {footerButtons[transferStep]}
        </FooterButtonsContainer>
      )}
    />
  );
};
