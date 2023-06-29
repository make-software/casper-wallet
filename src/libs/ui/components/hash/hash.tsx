import React, { useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { ContentColor, CopyToClipboard, Typography, Tag } from '@libs/ui';
import { CenteredFlexRow } from '@libs/layout';

import { truncateKey, TruncateKeySize } from './utils';

export enum HashVariant {
  CaptionHash = 'captionHash',
  BodyHash = 'bodyHash'
}

interface HashContainerProps {
  withHover?: boolean;
}

const HashContainer = styled(CenteredFlexRow)<HashContainerProps>`
  ${({ withHover, theme }) =>
    withHover && ` &:hover > span { color: ${theme.color.contentBlue}; }`};
`;

interface HashProps {
  value: string;
  variant: HashVariant;
  truncated?: boolean;
  truncatedSize?: TruncateKeySize;
  color?: ContentColor;
  withCopyOnSelfClick?: boolean;
  withTag?: boolean;
}

export function Hash({
  value,
  variant,
  withCopyOnSelfClick = true,
  truncated,
  color,
  withTag,
  truncatedSize
}: HashProps) {
  const { t } = useTranslation();

  const HashComponent = useMemo(
    () => (
      <>
        <Typography
          type={variant}
          wordBreak={!truncated}
          color={color || 'contentSecondary'}
        >
          {truncated ? truncateKey(value, { size: truncatedSize }) : value}
        </Typography>
        {withTag && (
          <Tag displayContext="accountList">{`${t('Imported')}`}</Tag>
        )}
      </>
    ),
    [truncatedSize, color, truncated, value, variant, withTag, t]
  );

  if (withCopyOnSelfClick) {
    return (
      <CopyToClipboard
        renderContent={({ isClicked }) => (
          <>
            {isClicked ? (
              <Typography type="captionHash" color="contentGreen">
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
