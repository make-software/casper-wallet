import { IDexToken } from 'casper-wallet-core/src/domain/swap';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

// Deep paths, not the '@libs/layout' / '@libs/ui/components' barrels: both
// re-export the header (via form-field.tsx), which pulls in
// webextension-polyfill and throws outside a browser extension context —
// including this repo's node-only jest. Every component below is barrel-free
// for the same reason.
import {
  AlignedFlexRow,
  AlignedSpaceBetweenFlexRow,
  FlexColumn,
  SpacingSize
} from '@libs/layout/containers';
import { Checkbox } from '@libs/ui/components/checkbox/checkbox';
import { Typography } from '@libs/ui/components/typography/typography';

import { DexTokenIcon } from './dex-token-icon';

const Container = styled(AlignedSpaceBetweenFlexRow)`
  height: 72px;
  padding: 0 16px;

  cursor: pointer;
`;

export interface TokenSelectorRowProps {
  token: IDexToken;
  isSelected: boolean;
  onSelect: () => void;
  /** The token was reached by a pasted contract hash and is neither whitelisted nor blacklisted. */
  isUnlisted?: boolean;
}

export const TokenSelectorRow = ({
  token,
  isSelected,
  onSelect,
  isUnlisted
}: TokenSelectorRowProps) => {
  const { t } = useTranslation();

  return (
    <Container onClick={onSelect}>
      <AlignedFlexRow gap={SpacingSize.Medium}>
        <DexTokenIcon
          icon={token.icon}
          symbol={token.symbol}
          name={token.name}
        />
        <FlexColumn>
          <Typography type="bodySemiBold" color="contentPrimary">
            {token.symbol}
          </Typography>
          <Typography type="captionRegular" color="contentSecondary">
            {isUnlisted ? <Trans t={t}>Unlisted token</Trans> : token.name}
          </Typography>
        </FlexColumn>
      </AlignedFlexRow>
      <Checkbox checked={isSelected} />
    </Container>
  );
};
