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
import { CenteredFlexRow } from '@libs/layout';

import { truncateKey } from './utils';

export enum HashVariant {
  CaptionHash = 'captionHash',
  BodyHash = 'bodyHash'
}

export enum HashDisplayContext {
  Home = 'home',
  AccountInfo = 'accountInfo'
}

interface HashContainerProps {
  displayContext?: HashDisplayContext;
}

interface HashValueProps {
  displayContext?: HashDisplayContext;
}

const HashContainer = styled(CenteredFlexRow)<HashContainerProps>`
  display: ${({ displayContext }) =>
    displayContext === HashDisplayContext.AccountInfo ? 'block' : 'flex'};
  align-items: center;
  height: ${({ displayContext }) =>
    displayContext === HashDisplayContext.Home ? '24px' : 'auto'};
`;

const CopyStatusContainer = styled.div`
  display: flex;
  gap: 4px;
`;

export const HoverCopyIcon = styled(SvgIcon)`
  display: none;

  &:hover svg {
    color: ${({ theme }) => theme.color.contentBlue};
  }
`;

const HashValue = styled(Typography)<HashValueProps>`
  word-break: break-all;
  line-height: ${({ displayContext }) =>
    displayContext === HashDisplayContext.AccountInfo && '24px'};
`;

interface HashProps {
  value: string;
  variant: HashVariant;
  truncated?: boolean;
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
  displayContext
}: HashProps) {
  const { t } = useTranslation();

  const HashComponent = useMemo(
    () => (
      <>
        <HashValue
          displayContext={displayContext}
          type={variant}
          color={color || 'contentSecondary'}
        >
          {truncated ? truncateKey(value) : value}
        </HashValue>
        {withTag && (
          <Tag displayContext="accountList">{`${t('Imported')}`}</Tag>
        )}
      </>
    ),
    [color, truncated, value, variant, withTag, t, displayContext]
  );

  if (withCopyIconOnHover) {
    return (
      <HashContainer displayContext={displayContext}>
        <HashValue type={variant} color={color || 'contentSecondary'}>
          {truncated ? truncateKey(value) : value}
        </HashValue>
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
              <CopyStatusContainer>
                <SvgIcon
                  color="contentGreen"
                  src="assets/icons/checkbox-checked.svg"
                />
                <Typography type="body" color="contentGreen">
                  <Trans t={t}>Copied!</Trans>
                </Typography>
              </CopyStatusContainer>
            ) : (
              <HashContainer displayContext={displayContext}>
                {HashComponent}
                <SvgIcon
                  src="assets/icons/copy.svg"
                  size={16}
                  marginLeft="small"
                  verticalAlign={
                    displayContext === 'accountInfo' ? 'text-bottom' : null
                  }
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
