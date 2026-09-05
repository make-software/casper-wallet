import { WrappedCsprContractPackageHash } from 'casper-wallet-core/src/domain/constants/casperNetwork';
import { CSPR_NATIVE_TOKEN_ID } from 'casper-wallet-core/src/domain/constants/config';
import type { ISwapDependencies } from 'casper-wallet-core/src/react';
import {
  useSwapTokens,
  useTokenWarnings,
  useWrapTokens
} from 'casper-wallet-core/src/react';
import React, { useEffect, useMemo, useRef } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectSwapSlippageSetting } from '@background/redux/settings/selectors';

import {
  AlignedSpaceBetweenFlexRow,
  ContentContainer,
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
import {
  SwapFormMode,
  getSelectableTokens,
  getSwapFormMode,
  isUnwrapEntry
} from './wrap-utils';

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

  const slippage = useSelector(selectSwapSlippageSetting);

  const wrappedCsprPackageHash =
    WrappedCsprContractPackageHash[swapDependencies.network];

  // Two entry-point ids core cannot resolve from `tokenInHash`, for opposite reasons:
  // CSPR_NATIVE_TOKEN_ID has no packageHash at all, so it would match no listed token and fire
  // a wasted lookup for a contract literally named 'cspr' (core's own default already
  // preselects CSPR); the wrapped-CSPR hash matches too well, because the synthetic native row
  // carries it, so core would resolve it straight back to CSPR. The effect below seeds the
  // unwrap pair for the second case.
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
    isFormValid: isSwapFormValid,
    setInitialTokens
  } = useSwapTokens({
    network: swapDependencies.network,
    activePublicKey: swapDependencies.activePublicKey,
    swapRepository: swapDependencies.swapRepository,
    dexContractRepository: swapDependencies.dexContractRepository,
    tokensRepository: swapDependencies.tokensRepository,
    slippage,
    tokenInHash
  });

  // CSPR/WCSPR has no DEX pool, so that pair routes through useWrapTokens instead. Both
  // hooks are always called — React forbids a conditional hook call — and the mode below
  // picks which one drives the view.
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

  // `useWrapTokens` rebuilds both legs itself, so its own tokens are the only place a real
  // WCSPR row exists — the listed tokens never carry one.
  const wcsprToken = wrapDirection === 'wrap' ? destinationToken : sourceToken;

  // Entering from WCSPR's token details means "unwrap this": seed both legs directly, once the
  // list has loaded enough to supply the native row. The mode effect above then aligns
  // `useWrapTokens`' own direction to the resulting pair.
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

  useEffect(() => {
    setIsReviewDisabled(!isFormValid);
  }, [isFormValid, setIsReviewDisabled]);

  // In wrap/unwrap mode there is no quote: cards, the flip button and the CTA are the same
  // form, but the rate line, Swap details, and the quote/unlisted banners are all suppressed.
  const isWrapMode = swapFormMode !== 'swap';

  // Both hooks keep their own copy of the pair, and only `useSwapTokens`' copy feeds the token
  // selector. Flipping both keeps them aligned, so the selector highlights — and replaces — the
  // leg the card actually shows; flipping only the direction inverts the two.
  const handleFlip = () => {
    handleSwitchTokens();

    if (isWrapMode) {
      switchDirection();
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

  return (
    <ContentContainer>
      <AlignedSpaceBetweenFlexRow>
        <Typography type="header">
          <Trans t={t}>Swap</Trans>
        </Typography>
        <SwapSettingsModal>
          {() => (
            <Typography type="body" color="contentAction">
              <Trans t={t}>Settings</Trans>
            </Typography>
          )}
        </SwapSettingsModal>
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
