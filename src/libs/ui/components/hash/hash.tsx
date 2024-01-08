import React, { useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { CenteredFlexRow } from '@libs/layout';
import {
  ContentColor,
  CopyToClipboard,
  Placement,
  Tag,
  Tooltip,
  Typography
} from '@libs/ui';

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
  value: string;
  variant: HashVariant;
  truncated?: boolean;
  truncatedSize?: TruncateKeySize;
  color?: ContentColor;
  withCopyOnSelfClick?: boolean;
  withTag?: boolean;
  placement?: Placement;
  withoutTooltip?: boolean;
}

export function Hash({
  value,
  variant,
  withCopyOnSelfClick = true,
  truncated,
  color,
  withTag,
  truncatedSize,
  placement,
  withoutTooltip = false
}: HashProps) {
  const { t } = useTranslation();

  const HashComponent = useMemo(
    () => (
      <>
        <Tooltip
          title={truncated && !withoutTooltip ? value : null}
          overflowWrap
          placement={placement}
        >
          <Typography
            type={variant}
            wordBreak={!truncated}
            color={color || 'contentSecondary'}
          >
            {truncated ? truncateKey(value, { size: truncatedSize }) : value}
          </Typography>
        </Tooltip>
        {withTag && (
          <Tag displayContext="accountList">{`${t('Imported')}`}</Tag>
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
      truncatedSize,
      withTag,
      t
    ]
  );

  if (withCopyOnSelfClick) {
    return (
      <CopyToClipboard
        renderContent={({ isClicked }) => (
          <>
            {isClicked ? (
              <Typography type="captionHash" color="contentPositive">
                <Trans t={t}>Copied!</Trans>
              </Typography>
            ) : (
              <HashContainer withHover>{HashComponent}</HashContainer>
            )}
          </>
        )}
        valueToCopy={value}
      />
    );
  }
  return <HashContainer>{HashComponent}</HashContainer>;
}
