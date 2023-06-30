import React, { useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  ContentColor,
  CopyToClipboard,
  SvgIcon,
  Typography,
  Tag
} from '@libs/ui';
import { CenteredFlexRow, FlexRow, SpacingSize } from '@libs/layout';

import { truncateKey } from './utils';

export enum HashVariant {
  CaptionHash = 'captionHash',
  BodyHash = 'bodyHash',
  FullHash = 'fullHash'
}

export enum HashDisplayContext {
  Home = 'home',
  AccountInfo = 'accountInfo'
}

interface HashContainerProps {
  displayContext?: HashDisplayContext;
}

const HashContainer = styled(CenteredFlexRow)<HashContainerProps>`
  display: ${({ displayContext }) =>
    displayContext === HashDisplayContext.AccountInfo ? 'block' : 'flex'};
  align-items: center;
  height: ${({ displayContext }) =>
    displayContext === HashDisplayContext.Home ? '24px' : 'auto'};
`;

export const HoverCopyIcon = styled(SvgIcon)`
  display: none;

  &:hover svg {
    color: ${({ theme }) => theme.color.contentBlue};
  }
`;

interface HashProps {
  value: string;
  variant: HashVariant;
  truncated?: boolean;
  truncatedSize?: 'tiny' | 'small' | 'max';
  color?: ContentColor;
  withCopyOnSelfClick?: boolean;
  withTag?: boolean;
  withCopyIconOnHover?: boolean;
  displayContext?: HashDisplayContext;
}

export function Hash({
  value,
  variant,
  withCopyOnSelfClick,
  truncated,
  color,
  withTag,
  withCopyIconOnHover,
  displayContext,
  truncatedSize
}: HashProps) {
  const { t } = useTranslation();

  const HashComponent = useMemo(
    () => (
      <>
        <Typography
          type={variant}
          wordBreak={displayContext === HashDisplayContext.AccountInfo}
          color={color || 'contentSecondary'}
        >
          {truncated ? truncateKey(value, { size: truncatedSize }) : value}
        </Typography>
        {withTag && (
          <Tag displayContext="accountList">{`${t('Imported')}`}</Tag>
        )}
      </>
    ),
    [
      truncatedSize,
      color,
      truncated,
      value,
      variant,
      withTag,
      displayContext,
      t
    ]
  );

  if (withCopyIconOnHover) {
    return (
      <HashContainer displayContext={displayContext}>
        <Typography
          type={variant}
          wordBreak={displayContext === HashDisplayContext.AccountInfo}
          color={color || 'contentSecondary'}
        >
          {truncated ? truncateKey(value, { size: truncatedSize }) : value}
        </Typography>
        <CopyToClipboard
          renderContent={({ isClicked }) => (
            <>
              {isClicked ? (
                <SvgIcon
                  color="contentGreen"
                  src="assets/icons/checkbox-checked.svg"
                  size={16}
                  marginLeft="small"
                />
              ) : (
                <HoverCopyIcon
                  src="assets/icons/copy.svg"
                  color="contentTertiary"
                  size={16}
                  marginLeft="small"
                />
              )}
            </>
          )}
          valueToCopy={value}
        />
        {withTag && (
          <Tag displayContext="accountList">{`${t('Imported')}`}</Tag>
        )}
      </HashContainer>
    );
  }

  if (withCopyOnSelfClick) {
    return (
      <CopyToClipboard
        renderContent={({ isClicked }) => (
          <>
            {isClicked ? (
              <FlexRow gap={SpacingSize.Tiny}>
                <SvgIcon
                  color="contentGreen"
                  src="assets/icons/checkbox-checked.svg"
                />
                <Typography type="body" color="contentGreen">
                  <Trans t={t}>Copied!</Trans>
                </Typography>
              </FlexRow>
            ) : (
              <HashContainer displayContext={displayContext}>
                {HashComponent}
                <SvgIcon
                  src="assets/icons/copy.svg"
                  size={16}
                  marginLeft="small"
                />
              </HashContainer>
            )}
          </>
        )}
        valueToCopy={value}
      />
    );
  }
  return (
    <HashContainer displayContext={displayContext}>
      {HashComponent}
    </HashContainer>
  );
}
