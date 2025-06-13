import { Maybe } from 'casper-wallet-core/src/typings/common';
import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';

import { useIsDarkMode } from '@hooks/use-is-dark-mode';

import { AlignedFlexRow, SpacingSize } from '@libs/layout';
import { Placement, SvgIcon, Typography } from '@libs/ui/components';
import { PortalTooltip } from '@libs/ui/components/portal-tooltip/portal-tooltip';
import { ContentColor } from '@libs/ui/utils';

import { CopyToClipboardComponent } from '../copy-to-clipboard-component/copy-to-clipboard-component';
import { HashTooltip } from './hash-tooltip';
import { TruncateKeySize, truncateKey } from './utils';

export enum HashVariant {
  CaptionHash = 'captionHash',
  BodyHash = 'bodyHash',
  ListSubtextHash = 'listSubtextHash'
}

interface HashContainerProps {
  withHover?: boolean;
}

const HashContainer = styled(AlignedFlexRow)<HashContainerProps>`
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
  label?: string;
  ownerName?: string;
  contractName?: string;
  withCopiedIcon?: boolean;
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
  withoutTooltip = false,
  isLedger,
  withCopyIcon,
  withOpacity,
  label,
  ownerName,
  contractName,
  withCopiedIcon = false
}: HashProps) {
  const isDarkMode = useIsDarkMode();

  const renderTitle = useCallback(() => {
    if (!(truncated && !withoutTooltip)) {
      return null;
    }

    if (label && value) {
      return (
        <HashTooltip
          hash={value}
          hashLabel={label}
          csprName={csprName}
          ownerName={ownerName}
          contractName={contractName}
        />
      );
    }

    return (
      <Typography type="captionRegular" overflowWrap color="contentPrimary">
        {value}
      </Typography>
    );
  }, [
    csprName,
    label,
    ownerName,
    truncated,
    value,
    withOpacity,
    withoutTooltip
  ]);

  const HashComponent = useMemo(
    () => (
      <>
        <PortalTooltip title={renderTitle()}>
          <CopyToClipboardComponent
            enabled={Boolean(withCopyOnSelfClick || withCopyIcon)}
            withCopyIcon={Boolean(withCopyIcon)}
            valueToCopy={value || ''}
            copiedElement={
              withCopiedIcon ? (
                <SvgIcon
                  src="assets/icons/tick.svg"
                  color={'contentPositive'}
                  size={16}
                />
              ) : undefined
            }
            copyElement={
              withCopiedIcon ? (
                <SvgIcon
                  src="assets/icons/copy.svg"
                  style={{ opacity: withOpacity ? '0.4' : '1' }}
                  {...(withOpacity && { color: 'contentOnFill' })}
                  size={16}
                />
              ) : undefined
            }
            copiedElementWithChildren={withCopiedIcon}
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
            {withCopyIcon && !withCopiedIcon && (
              <SvgIcon
                src="assets/icons/copy.svg"
                style={{ opacity: withOpacity ? '0.4' : '1' }}
                {...(withOpacity && { color: 'contentOnFill' })}
                size={16}
              />
            )}
          </CopyToClipboardComponent>
        </PortalTooltip>
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
      </>
    ),
    [
      renderTitle,
      withCopyOnSelfClick,
      withCopyIcon,
      value,
      withCopiedIcon,
      withOpacity,
      csprName,
      variant,
      truncated,
      color,
      truncatedSize,
      isImported,
      isLedger,
      isDarkMode
    ]
  );

  return <HashContainer gap={SpacingSize.Tiny}>{HashComponent}</HashContainer>;
}
