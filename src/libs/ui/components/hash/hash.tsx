import { Maybe } from 'casper-wallet-core/src/typings/common';
import React, { useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { useIsDarkMode } from '@hooks/use-is-dark-mode';

import { CenteredFlexRow, SpacingSize } from '@libs/layout';
import {
  CopyToClipboard,
  Placement,
  SvgIcon,
  Tooltip,
  Typography
} from '@libs/ui/components';
import { ContentColor } from '@libs/ui/utils';

import { TruncateKeySize, truncateKey } from './utils';

export enum HashVariant {
  CaptionHash = 'captionHash',
  BodyHash = 'bodyHash',
  ListSubtextHash = 'listSubtextHash'
}

interface HashContainerProps {
  withHover?: boolean;
}

const HashContainer = styled(CenteredFlexRow)<HashContainerProps>`
  ${({ withHover, theme }) =>
    withHover && ` &:hover > span { color: ${theme.color.contentAction}; }`};
`;

interface HashProps {
  value: Maybe<string>;
  variant: HashVariant;
  truncated?: boolean;
  truncatedSize?: TruncateKeySize;
  color?: ContentColor;
  withCopyOnSelfClick?: boolean;
  isImported?: boolean;
  isLedger?: boolean;
  placement?: Placement;
  withoutTooltip?: boolean;
  withCopyIcon?: boolean;
  csprName?: Maybe<string>;
  withOpacity?: boolean;
}

export function Hash({
  value,
  csprName,
  variant,
  withCopyOnSelfClick = true,
  truncated,
  color,
  isImported,
  truncatedSize,
  placement,
  withoutTooltip = false,
  isLedger,
  withCopyIcon,
  withOpacity
}: HashProps) {
  const { t } = useTranslation();
  const isDarkMode = useIsDarkMode();

  const HashComponent = useMemo(
    () => (
      <>
        <Tooltip
          title={truncated && !withoutTooltip ? value : null}
          overflowWrap
          placement={placement}
        >
          <Typography
            type={csprName ? 'captionRegular' : variant}
            wordBreak={!truncated}
            color={color || 'contentSecondary'}
            style={{ opacity: withOpacity ? '0.8' : '1' }}
          >
            {csprName
              ? csprName
              : truncated
                ? truncateKey(value || '', { size: truncatedSize })
                : value}
          </Typography>
        </Tooltip>
        {isImported && (
          <SvgIcon
            src="assets/icons/upload.svg"
            dataTestId="import-account-icon"
            size={20}
          />
        )}
        {isLedger && (
          <SvgIcon
            src={
              isDarkMode
                ? 'assets/icons/ledger-white.svg'
                : 'assets/icons/ledger-blue.svg'
            }
            size={20}
          />
        )}
        {withCopyIcon && (
          <SvgIcon
            src="assets/icons/copy.svg"
            style={{ opacity: withOpacity ? '0.4' : '1' }}
            {...(withOpacity && { color: 'contentOnFill' })}
            size={16}
          />
        )}
      </>
    ),
    [
      truncated,
      withoutTooltip,
      value,
      placement,
      variant,
      color,
      csprName,
      truncatedSize,
      isImported,
      isLedger,
      isDarkMode,
      withCopyIcon
    ]
  );

  if (withCopyOnSelfClick || withCopyIcon) {
    return (
      <CopyToClipboard
        renderContent={({ isClicked }) => (
          <>
            {isClicked ? (
              <Typography type="captionHash" color="contentPositive">
                <Trans t={t}>Copied!</Trans>
              </Typography>
            ) : (
              <HashContainer
                gap={withCopyIcon ? SpacingSize.Small : SpacingSize.Tiny}
                withHover
              >
                {HashComponent}
              </HashContainer>
            )}
          </>
        )}
        valueToCopy={value || ''}
      />
    );
  }

  return <HashContainer gap={SpacingSize.Tiny}>{HashComponent}</HashContainer>;
}
