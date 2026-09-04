import { WrappedCsprContractPackageHash } from 'casper-wallet-core/src/domain/constants/casperNetwork';
import {
  CSPR_NATIVE_TOKEN_ID,
  DEFAULT_SLIPPAGE
} from 'casper-wallet-core/src/domain/constants/config';
import type { ISwapDependencies } from 'casper-wallet-core/src/react';
import {
  useSwapTokens,
  useTokenWarnings,
  useWrapTokens
} from 'casper-wallet-core/src/react';
import React, { useEffect, useRef } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  AlignedSpaceBetweenFlexRow,
  ContentContainer,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { Typography } from '@libs/ui/components';

import { SwapBanner } from './components/swap-banner';
import { SwapDetails } from './components/swap-details';
import { SwitchTokensButton } from './components/switch-tokens-button';
import { TokenAmountCard } from './components/token-amount-card';
import { TokenSelectorModal } from './components/token-selector-modal';
import { SwapFormMode, getSwapFormMode } from './wrap-utils';

interface FormStepProps {
  swapDependencies: ISwapDependencies;
  swapFromTokenId: string | null;
  setIsReviewDisabled: React.Dispatch<React.SetStateAction<boolean>>;
}

const CardsGapContainer = styled.div`
  position: relative;
  height: 48px;
  padding-right: 76px;

  display: flex;
  align-items: center;
`;

export function FormStep({
  swapDependencies,
  swapFromTokenId,
  setIsReviewDisabled
}: FormStepProps) {
  const { t } = useTranslation();

  // Deep-link support (the Home entry point sends the synthetic native id).
  // CSPR_NATIVE_TOKEN_ID has no packageHash, so passing it through would
  // match no listed token and fire a wasted lookup for a contract package
  // literally named 'cspr'; core's own default (useTokenPairState) already
  // preselects CSPR when tokenInHash is undefined.
  const tokenInHash =
    swapFromTokenId != null && swapFromTokenId !== CSPR_NATIVE_TOKEN_ID
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
    isFormValid: isSwapFormValid
  } = useSwapTokens({
    network: swapDependencies.network,
    activePublicKey: swapDependencies.activePublicKey,
    swapRepository: swapDependencies.swapRepository,
    dexContractRepository: swapDependencies.dexContractRepository,
    tokensRepository: swapDependencies.tokensRepository,
    slippage: DEFAULT_SLIPPAGE,
    tokenInHash
  });

  // CSPR/WCSPR has no DEX pool, so that pair routes through useWrapTokens instead. Both
  // hooks are always called — React forbids a conditional hook call — and the mode below
  // picks which one drives the view.
  const wrappedCsprPackageHash =
    WrappedCsprContractPackageHash[swapDependencies.network];

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
    sourceTokenFiatAmount,
    isFormValid: isWrapFormValid,
    updateAmount: updateWrapAmount,
    switchDirection,
    getTokenBalance: getWrapTokenBalance
  } = useWrapTokens({
    network: swapDependencies.network,
    activePublicKey: swapDependencies.activePublicKey,
    swapRepository: swapDependencies.swapRepository,
    tokensRepository: swapDependencies.tokensRepository
  });

  // useWrapTokens owns no concept of "which token the user picked first" - only its own
  // toggled `direction`. Align it once when the selected pair turns into a wrap pair; further
  // renders in the same pair leave the user's own flips alone.
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

  const { unlistedTokens } = useTokenWarnings(selectedTokens, 'swap');
  const unlistedTokenPackageHash =
    swapFormMode === 'swap' ? (unlistedTokens[0]?.packageHash ?? null) : null;

  useEffect(() => {
    setIsReviewDisabled(!isFormValid);
  }, [isFormValid, setIsReviewDisabled]);

  // In wrap/unwrap mode there is no quote: cards, the flip button and the CTA are the same
  // form, but the rate line, Swap details, and the quote/unlisted banners are all suppressed.
  const isWrapMode = swapFormMode !== 'swap';

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

  return (
    <ContentContainer>
      <AlignedSpaceBetweenFlexRow>
        <Typography type="header">
          <Trans t={t}>Swap</Trans>
        </Typography>
        <Typography type="body" color="contentAction">
          <Trans t={t}>Settings</Trans>
        </Typography>
      </AlignedSpaceBetweenFlexRow>

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
              ? updateWrapAmount(getWrapTokenBalance('first'))
              : updateAmount('first', getMaxUsableBalance('first'))
          }
          hasError={false}
        />
      </VerticalSpaceContainer>

      <CardsGapContainer>
        {!isWrapMode && quote != null && (
          <Typography type="listSubtextHash" color="contentSecondary">
            {quote}
          </Typography>
        )}
        <SwitchTokensButton
          onClick={isWrapMode ? switchDirection : handleSwitchTokens}
        />
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
          tokens={tokens}
          isLoading={tokens == null}
          selectedTokenId={activeSelectedToken?.id ?? null}
          onSelect={selectToken}
          closeModal={closeTokenSelector}
        />
      )}
    </ContentContainer>
  );
}
