import { IDexToken } from 'casper-wallet-core/src/domain/swap';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { isBundledAssetPath } from '@src/utils';

// Deep paths, not the '@libs/layout' / '@libs/ui/components' barrels: both
// re-export the header (via form-field.tsx), which pulls in
// webextension-polyfill and throws outside a browser extension context —
// including this repo's node-only jest. RemoteIcon and SvgIcon already avoid
// this for the same reason; Typography's own file has no barrel dependency.
import {
  AlignedFlexRow,
  AlignedSpaceBetweenFlexRow,
  FlexColumn,
  SpacingSize
} from '@libs/layout/containers';
import { RemoteIcon } from '@libs/ui/components/remote-icon/remote-icon';
import { SvgIcon } from '@libs/ui/components/svg-icon/svg-icon';
import { Typography } from '@libs/ui/components/typography/typography';

const Container = styled(AlignedSpaceBetweenFlexRow)`
  height: 72px;
  padding: 0 16px;

  cursor: pointer;
`;

// Checkbox's `variant="circle"` is the same radio icon this row draws, but
// Checkbox always imports the '@libs/ui/components' barrel internally, so it
// cannot be used here — see the import note above. Replicated directly.
const RadioIcon = ({ checked }: { checked: boolean }) => (
  <SvgIcon
    src={
      checked
        ? 'assets/icons/radio-button-on.svg'
        : 'assets/icons/radio-button-off.svg'
    }
    size={24}
    color="contentAction"
  />
);

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
        {token.icon != null && isBundledAssetPath(token.icon) ? (
          <SvgIcon src={token.icon} alt={token.symbol} size={32} />
        ) : (
          <RemoteIcon
            src={token.icon}
            size={32}
            alt={token.symbol}
            title={token.name}
            borderRadius={100}
          />
        )}
        <FlexColumn>
          <Typography type="bodySemiBold" color="contentPrimary">
            {token.symbol}
          </Typography>
          <Typography type="captionRegular" color="contentSecondary">
            {isUnlisted ? <Trans t={t}>Unlisted token</Trans> : token.name}
          </Typography>
        </FlexColumn>
      </AlignedFlexRow>
      <RadioIcon checked={isSelected} />
    </Container>
  );
};
