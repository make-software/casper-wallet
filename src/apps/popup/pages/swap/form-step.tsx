import { WrappedCsprContractPackageHash } from 'casper-wallet-core/src/domain/constants/casperNetwork';
import { USD_CURRENCY_CODE } from 'casper-wallet-core/src/domain/constants/common';
import { CSPR_NATIVE_TOKEN_ID } from 'casper-wallet-core/src/domain/constants/config';
import type { IDexTokenWithAmount } from 'casper-wallet-core/src/domain/swap';
import type { ISwapDependencies } from 'casper-wallet-core/src/react';
import {
  useFetchCsprFiatRates,
  useSwapTokens,
  useTokenWarnings,
  useWrapTokens
} from 'casper-wallet-core/src/react';
import {
  calculateMaxUsableBalance,
  calculateSwapFee,
  calculateTokenFiatAmount
} from 'casper-wallet-core/src/utils/swap';
import React, { useEffect, useMemo, useRef } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectSwapSlippageSetting } from '@background/redux/settings/selectors';

import {
  AlignedSpaceBetweenFlexRow,
  ContentContainer,
  NavLinkTokenBalance,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { Typography } from '@libs/ui/components';

import { SwapBanner } from './components/swap-banner';
import { SwapDetails } from './components/swap-details';
import { SwapSettingsModal } from './components/swap-settings-modal';
import { SwitchTokensButton } from './components/switch-tokens-button';
import { TokenAmountCard } from './components/token-amount-card';
import { TokenSelectorModal } from './components/token-selector-modal';
import { WrapDetails } from './components/wrap-details';
import { ISwapReviewData } from './types';
import { buildPayTokenBalance, resolveSwapBalanceBanner } from './utils';
import {
  SwapFormMode,
  calculateWrapNetworkCost,
  getSelectableTokens,
  getSwapFormMode,
  isUnwrapEntry,
  swapModeLabels
} from './wrap-utils';

interface FormStepProps {
  swapDependencies: ISwapDependencies;
  swapFromTokenId: string | null;
  /** Hands the composed review up whenever it changes, or `null` while the form is invalid. */
  onReviewChange: (review: ISwapReviewData | null) => void;
  onPayTokenBalanceChange: (balance: NavLinkTokenBalance | null) => void;
}

const CardsGapContainer = styled.div`
  position: relative;
  height: 48px;
  padding-right: 88px;

  display: flex;
  align-items: center;
`;

export function FormStep({
  swapDependencies,
  swapFromTokenId,
  onReviewChange,
  onPayTokenBalanceChange
}: FormStepProps) {
  const { t } = useTranslation();

  const slippage = useSelector(selectSwapSlippageSetting);

  const wrappedCsprPackageHash =
    WrappedCsprContractPackageHash[swapDependencies.network];

  // Neither entry id resolves through `tokenInHash`: native CSPR has no packageHash, WCSPR's
  // resolves back to CSPR.
  const isUnwrapDeepLink = isUnwrapEntry(
    swapFromTokenId,
    wrappedCsprPackageHash
  );
  const tokenInHash =
    swapFromTokenId != null &&
    swapFromTokenId !== CSPR_NATIVE_TOKEN_ID &&
    !isUnwrapDeepLink
      ? swapFromTokenId
      : undefined;

  const {
    tokenAmounts,
    selectedTokens,
    updateAmount,
    handleSwitchTokens,
    getMaxUsableBalance,
    firstTokenFiatAmount,
    secondTokenFiatAmount,
    quote,
    openTokenSelector,
    selectToken,
    isTokenSelectorOpen,
    closeTokenSelector,
    activeTokenPosition,
    tokens,
    priceImpact,
    protocolFee,
    networkCost,
    maxSlippage,
    path,
    quoteData,
    quotedTrade,
    isFormValid: isSwapFormValid,
    isAmountEntered,
    isAmountExceedsBalance,
    isInsufficientCsprForFees,
    setInitialTokens,
    getTokenBalance
  } = useSwapTokens({
    network: swapDependencies.network,
    activePublicKey: swapDependencies.activePublicKey,
    swapRepository: swapDependencies.swapRepository,
    dexContractRepository: swapDependencies.dexContractRepository,
    tokensRepository: swapDependencies.tokensRepository,
    slippage,
    tokenInHash
  });

  // CSPR/WCSPR has no DEX pool, so that pair routes through useWrapTokens; both hooks always run.
  const swapFormMode = getSwapFormMode({
    first: selectedTokens.first,
    second: selectedTokens.second,
    wrappedCsprPackageHash
  });

  const {
    direction: wrapDirection,
    amount: wrapAmount,
    sourceToken,
    destinationToken,
    sourceRawAmount,
    sourceTokenFiatAmount,
    isFormValid: isWrapFormValid,
    isAmountEntered: isWrapAmountEntered,
    isAmountExceedsBalance: isWrapAmountExceedsBalance,
    isInsufficientCsprForFees: isWrapInsufficientCsprForFees,
    updateAmount: updateWrapAmount,
    switchDirection,
    getTokenBalance: getWrapTokenBalance
  } = useWrapTokens({
    network: swapDependencies.network,
    activePublicKey: swapDependencies.activePublicKey,
    swapRepository: swapDependencies.swapRepository,
    tokensRepository: swapDependencies.tokensRepository
  });

  // Already in flight for the fiat amounts, and keyed per network — a cache read, not a request.
  const { csprFiatRates } = useFetchCsprFiatRates({
    network: swapDependencies.network,
    tokensRepository: swapDependencies.tokensRepository
  });
  const wrapNetworkCost = calculateWrapNetworkCost(
    wrapDirection,
    csprFiatRates,
    USD_CURRENCY_CODE
  );

  // useWrapTokens knows only its own toggled `direction`: align it once per pair, not per render.
  const syncedWrapModeRef = useRef<SwapFormMode | null>(null);
  useEffect(() => {
    if (swapFormMode === 'swap') {
      syncedWrapModeRef.current = null;
      return;
    }

    if (syncedWrapModeRef.current !== swapFormMode) {
      if (wrapDirection !== swapFormMode) {
        switchDirection();
      }
      syncedWrapModeRef.current = swapFormMode;
    }
  }, [swapFormMode, wrapDirection, switchDirection]);

  const isFormValid =
    swapFormMode === 'swap' ? isSwapFormValid : isWrapFormValid;

  const activeSelectedToken =
    activeTokenPosition === 'first'
      ? selectedTokens.first
      : selectedTokens.second;

  // `useWrapTokens` rebuilds both legs itself; the listed tokens never carry a real WCSPR row.
  const wcsprToken = wrapDirection === 'wrap' ? destinationToken : sourceToken;

  // Entering from WCSPR's token details means "unwrap this": seed both legs from the native row.
  const hasSeededUnwrapPairRef = useRef(false);
  useEffect(() => {
    if (hasSeededUnwrapPairRef.current || !isUnwrapDeepLink) {
      return;
    }

    const nativeCsprToken = tokens?.find(
      token => token.id === CSPR_NATIVE_TOKEN_ID
    );

    if (wcsprToken == null || nativeCsprToken == null) {
      return;
    }

    setInitialTokens(wcsprToken, nativeCsprToken);
    hasSeededUnwrapPairRef.current = true;
  }, [isUnwrapDeepLink, tokens, wcsprToken, setInitialTokens]);
  const selectorTokens = useMemo(
    () =>
      getSelectableTokens({
        tokens,
        wcsprToken,
        oppositeToken:
          activeTokenPosition === 'first'
            ? selectedTokens.second
            : selectedTokens.first
      }),
    [
      tokens,
      wcsprToken,
      activeTokenPosition,
      selectedTokens.first,
      selectedTokens.second
    ]
  );

  const { unlistedTokens } = useTokenWarnings(selectedTokens, 'swap');
  const unlistedTokenPackageHash =
    swapFormMode === 'swap' ? (unlistedTokens[0]?.packageHash ?? null) : null;

  // The one-quote rule: every swap field comes off this single `quotedTrade` snapshot, fiat too.
  const swapReview = useMemo<ISwapReviewData | null>(() => {
    if (!isFormValid) {
      return null;
    }

    if (swapFormMode === 'swap') {
      if (quotedTrade == null) {
        return null;
      }

      const quotedFiatAmount = (token: IDexTokenWithAmount) =>
        calculateTokenFiatAmount(
          token,
          token.amountFormatted,
          USD_CURRENCY_CODE,
          token.fiatRates,
          csprFiatRates
        );

      return {
        kind: 'swap',
        trade: {
          firstToken: {
            ...quotedTrade.firstToken,
            fiatAmount: quotedFiatAmount(quotedTrade.firstToken)
          },
          secondToken: {
            ...quotedTrade.secondToken,
            fiatAmount: quotedFiatAmount(quotedTrade.secondToken)
          },
          path: quotedTrade.path,
          quoteType: quotedTrade.quoteType
        },
        rate: quote,
        priceImpact,
        // This field is contracted symbol-free, where core's `protocolFee` is "<amount> <symbol>".
        protocolFee: calculateSwapFee(quotedTrade.firstToken.amountFormatted)
      };
    }

    return {
      kind: 'wrap',
      direction: wrapDirection,
      sourceToken,
      destinationToken,
      amountFormatted: wrapAmount,
      rawAmount: sourceRawAmount,
      fiatAmount: sourceTokenFiatAmount,
      networkCost: wrapNetworkCost
    };
  }, [
    isFormValid,
    swapFormMode,
    quotedTrade,
    csprFiatRates,
    quote,
    priceImpact,
    wrapDirection,
    sourceToken,
    destinationToken,
    wrapAmount,
    sourceRawAmount,
    sourceTokenFiatAmount,
    wrapNetworkCost
  ]);

  useEffect(() => {
    onReviewChange(swapReview);
  }, [swapReview, onReviewChange]);

  const isWrapMode = swapFormMode !== 'swap';
  const labels = swapModeLabels[swapFormMode];

  // Only `useSwapTokens`' copy of the pair feeds the selector; flipping just the direction inverts them.
  const handleFlip = () => {
    handleSwitchTokens();

    if (isWrapMode) {
      // `switchDirection` clears the amount, but a wrap is 1:1 — the same figure still describes it.
      const enteredAmount = wrapAmount;

      switchDirection();
      updateWrapAmount(enteredAmount);
    }
  };

  const firstCardToken = isWrapMode ? sourceToken : selectedTokens.first;
  const secondCardToken = isWrapMode ? destinationToken : selectedTokens.second;
  const firstCardAmount = isWrapMode
    ? wrapAmount
    : tokenAmounts.first.formatted;
  const secondCardAmount = isWrapMode
    ? wrapAmount
    : tokenAmounts.second.formatted;
  const firstCardFiatAmount = isWrapMode
    ? sourceTokenFiatAmount
    : firstTokenFiatAmount;
  const secondCardFiatAmount = isWrapMode
    ? sourceTokenFiatAmount
    : secondTokenFiatAmount;

  // Both hooks compute affordability the same way; only the one driving the view may speak.
  const balanceBanner = resolveSwapBalanceBanner(
    isWrapMode
      ? {
          isAmountEntered: isWrapAmountEntered,
          hasInsufficientBalance: isWrapAmountExceedsBalance('first'),
          hasInsufficientCsprForFee: isWrapInsufficientCsprForFees()
        }
      : {
          isAmountEntered,
          hasInsufficientBalance: isAmountExceedsBalance('first'),
          hasInsufficientCsprForFee: isInsufficientCsprForFees()
        }
  );

  // The wrap arm exposes no `getMaxUsableBalance`: reserve the fee here, on a native CSPR leg only.
  const wrapMaxUsableBalance = () =>
    calculateMaxUsableBalance({
      balance: getWrapTokenBalance('first'),
      symbol: sourceToken.symbol,
      context: 'wrap'
    });

  const payTokenBalance = useMemo(
    () =>
      buildPayTokenBalance(
        firstCardToken,
        isWrapMode ? getWrapTokenBalance('first') : getTokenBalance('first')
      ),
    [firstCardToken, isWrapMode, getWrapTokenBalance, getTokenBalance]
  );

  useEffect(() => {
    onPayTokenBalanceChange(payTokenBalance);
  }, [payTokenBalance, onPayTokenBalanceChange]);

  return (
    <ContentContainer>
      <VerticalSpaceContainer top={SpacingSize.XL}>
        <AlignedSpaceBetweenFlexRow>
          <Typography type="header">
            <Trans t={t}>{labels.formTitle}</Trans>
          </Typography>
          {/* Slippage and deadline are quote settings; a wrap is 1:1 and reads neither. */}
          {!isWrapMode && (
            <SwapSettingsModal>
              {() => (
                <Typography type="body" color="contentAction">
                  <Trans t={t}>Settings</Trans>
                </Typography>
              )}
            </SwapSettingsModal>
          )}
        </AlignedSpaceBetweenFlexRow>
      </VerticalSpaceContainer>

      <VerticalSpaceContainer top={SpacingSize.Large}>
        <TokenAmountCard
          position="first"
          token={firstCardToken}
          amount={firstCardAmount}
          fiatAmount={firstCardFiatAmount}
          decimals={firstCardToken?.decimals ?? 0}
          onAmountChange={value =>
            isWrapMode ? updateWrapAmount(value) : updateAmount('first', value)
          }
          onOpenSelector={() => openTokenSelector('first')}
          onSwapMax={() =>
            isWrapMode
              ? updateWrapAmount(wrapMaxUsableBalance())
              : updateAmount('first', getMaxUsableBalance('first'))
          }
          maxLabel={labels.maxLabel}
          hasError={balanceBanner === 'insufficientBalance'}
        />
      </VerticalSpaceContainer>

      <CardsGapContainer>
        {!isWrapMode && quote != null && (
          <Typography type="listSubtextHash" color="contentSecondary">
            {quote}
          </Typography>
        )}
        <SwitchTokensButton onClick={handleFlip} />
      </CardsGapContainer>

      <TokenAmountCard
        position="second"
        token={secondCardToken}
        amount={secondCardAmount}
        fiatAmount={secondCardFiatAmount}
        decimals={secondCardToken?.decimals ?? 0}
        onAmountChange={value =>
          isWrapMode ? updateWrapAmount(value) : updateAmount('second', value)
        }
        onOpenSelector={() => openTokenSelector('second')}
        hasError={false}
      />

      {balanceBanner != null && (
        <VerticalSpaceContainer top={SpacingSize.Large}>
          {balanceBanner === 'insufficientBalance' ? (
            <SwapBanner
              variant="error"
              icon="assets/icons/error.svg"
              title={<Trans t={t}>Not enough liquid balance</Trans>}
              body={
                <Trans
                  t={t}
                  defaults="You don’t have enough liquid <t>{{symbol}}</t> to complete this transaction. You can adjust the transaction details to proceed."
                  values={{ symbol: firstCardToken?.symbol ?? '' }}
                  components={{
                    t: (
                      <Typography type="captionMedium" color="contentPrimary" />
                    )
                  }}
                />
              }
            />
          ) : (
            <SwapBanner
              variant="error"
              icon="assets/icons/error.svg"
              title={<Trans t={t}>Not enough CSPR</Trans>}
              body={
                <Trans t={t}>
                  You don’t have enough CSPR to cover the network fee.
                </Trans>
              }
            />
          )}
        </VerticalSpaceContainer>
      )}

      {isWrapMode && (
        <WrapDetails
          title={labels.detailsTitle}
          networkCost={wrapNetworkCost}
        />
      )}

      {!isWrapMode &&
        (quoteData.error != null ? (
          <VerticalSpaceContainer top={SpacingSize.Large}>
            <SwapBanner
              variant="error"
              icon="assets/icons/error.svg"
              title={<Trans t={t}>Trading quote wasn’t found</Trans>}
              body={
                <Trans t={t}>Please select a different trading pair.</Trans>
              }
            />
          </VerticalSpaceContainer>
        ) : (
          <>
            {unlistedTokenPackageHash != null && (
              <VerticalSpaceContainer top={SpacingSize.Large}>
                <SwapBanner
                  variant="warning"
                  title={<Trans t={t}>Important</Trans>}
                  body={
                    <Trans t={t}>
                      You are trading an unlisted token. Verify the contract
                      address carefully, and proceed only if you understand the
                      risks.
                    </Trans>
                  }
                />
              </VerticalSpaceContainer>
            )}

            <SwapDetails
              network={swapDependencies.network}
              swapRepository={swapDependencies.swapRepository}
              title={labels.detailsTitle}
              quote={quote}
              priceImpact={priceImpact}
              protocolFee={protocolFee}
              networkCost={networkCost}
              maxSlippage={maxSlippage}
              path={path}
              tokens={tokens ?? []}
              unlistedTokenPackageHash={unlistedTokenPackageHash}
            />
          </>
        ))}

      {isTokenSelectorOpen && (
        <TokenSelectorModal
          tokens={selectorTokens}
          isLoading={tokens == null}
          selectedTokenId={activeSelectedToken?.id ?? null}
          onSelect={selectToken}
          closeModal={closeTokenSelector}
        />
      )}
    </ContentContainer>
  );
}
