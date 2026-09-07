import { TOKEN_DISPLAY_DECIMALS } from 'casper-wallet-core/src/domain/constants/config';
import { IDexToken } from 'casper-wallet-core/src/domain/swap';
import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

// Deep paths: the barrels re-export the header, which loads webextension-polyfill
// and throws under the node-only jest environment this file's render test uses.
import {
  AlignedFlexRow,
  AlignedSpaceBetweenFlexRow,
  FlexColumn,
  SpacingSize
} from '@libs/layout/containers';
import { truncateKey } from '@libs/ui/components/hash/utils';
import { SvgIcon } from '@libs/ui/components/svg-icon/svg-icon';
import { Typography } from '@libs/ui/components/typography/typography';

import {
  formatAmountForDisplay,
  sanitizeAmountInput
} from '../amount-input-utils';
import { DexTokenIcon } from './dex-token-icon';

type TokenCardPosition = 'first' | 'second';

export interface TokenAmountCardProps {
  position: TokenCardPosition;
  token: IDexToken | null;
  amount: string;
  fiatAmount: string;
  decimals: number;
  onAmountChange: (value: string) => void;
  onOpenSelector: () => void;
  onSwapMax?: () => void; // pay card only
  /** The typed amount is more than the card's token can cover: render it critical. */
  hasError: boolean;
}

const Card = styled(FlexColumn)`
  position: relative;
  min-height: 92px;
  padding: 16px;

  background-color: ${({ theme }) => theme.color.backgroundPrimary};
  border-radius: ${({ theme }) => theme.borderRadius.base}px;
`;

const TopRow = styled(AlignedSpaceBetweenFlexRow)`
  align-items: flex-start;
`;

// Not `@libs/ui` Input: that renders a boxed 4rem field with its own background,
// where the card needs a borderless amount sitting on the card's own surface.
const AmountInput = styled.input<{ $hasError: boolean }>`
  flex-grow: 1;
  min-width: 0;
  padding: 0;
  border: none;
  outline: none;
  background: inherit;

  color: ${({ theme, $hasError }) =>
    $hasError ? theme.color.contentActionCritical : theme.color.contentPrimary};
  font-family: ${({ theme }) => theme.typography.fontFamily.mono};
  font-size: 2rem;
  line-height: 2.8rem;

  ::placeholder {
    color: ${({ theme }) => theme.color.contentSecondary};
  }
`;

const TokenButton = styled(AlignedFlexRow)`
  flex-shrink: 0;
  cursor: pointer;
`;

const BottomRow = styled(AlignedSpaceBetweenFlexRow)`
  margin-top: 8px;
`;

const SwapMaxLabel = styled(Typography)`
  cursor: pointer;
`;

export const TokenAmountCard = ({
  position,
  token,
  amount,
  fiatAmount,
  decimals,
  onAmountChange,
  onOpenSelector,
  onSwapMax,
  hasError
}: TokenAmountCardProps) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (raw: string) => {
    const next = sanitizeAmountInput(raw, decimals);
    if (next !== null) {
      onAmountChange(next);
    }
  };

  const isUnlisted =
    token != null && !token.isWhitelisted && !token.isBlacklisted;

  return (
    <Card data-position={position}>
      <TopRow>
        <AmountInput
          $hasError={hasError}
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={formatAmountForDisplay(
            amount,
            isEditing ? undefined : TOKEN_DISPLAY_DECIMALS
          )}
          onFocus={() => setIsEditing(true)}
          onBlur={() => setIsEditing(false)}
          onChange={e => handleChange(e.target.value)}
        />
        <TokenButton gap={SpacingSize.Small} onClick={onOpenSelector}>
          {token != null && (
            <DexTokenIcon
              icon={token.icon}
              symbol={token.symbol}
              name={token.name}
            />
          )}
          {token == null ? (
            <Typography type="bodySemiBold" color="contentAction">
              <Trans t={t}>Token</Trans>
            </Typography>
          ) : (
            <FlexColumn>
              <Typography type="bodySemiBold">
                {isUnlisted ? truncateKey(token.packageHash) : token.symbol}
              </Typography>
              {isUnlisted && (
                <Typography type="labelMedium" color="contentSecondary">
                  <Trans t={t}>Unlisted token</Trans>
                </Typography>
              )}
            </FlexColumn>
          )}
          <SvgIcon
            src="assets/icons/chevron.svg"
            size={16}
            style={{ transform: 'rotate(90deg)' }}
          />
        </TokenButton>
      </TopRow>

      <BottomRow>
        <Typography type="captionRegular" color="contentSecondary">
          {fiatAmount}
        </Typography>
        {onSwapMax && (
          <SwapMaxLabel
            type="captionRegular"
            color="contentAction"
            onClick={onSwapMax}
          >
            <Trans t={t}>Swap max</Trans>
          </SwapMaxLabel>
        )}
      </BottomRow>
    </Card>
  );
};
